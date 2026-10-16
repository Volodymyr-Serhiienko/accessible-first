import { isHTMLElement, restoreAttribute } from "../../../core/src/dom";
import { addEventListener, runCleanups, type Cleanup } from "../../../core/src/events";
import { focusElement } from "../../../core/src/focus";
import { createId } from "../../../core/src/id";
import { createComponentLifecycle } from "../foundation";
import { createDocumentAnnouncementChannel } from "../../../core/src/live-region";
import {
    accessibleFirstEnglishMessages,
    getLocaleText
} from "../localization";
import type {
    Toast,
    ToastCloseReason,
    ToastInput,
    ToastLocalization,
    ToastPlacement,
    ToastPoliteness,
    ToastShowOptions,
    ToastUpdateOptions,
    ToastVariant,
    ToastViewport,
    ToastViewportOptions
} from "./types";

interface ToastState {
    id: string;
    title: string;
    description: string;
    variant: ToastVariant;
    politeness: ToastPoliteness;
    duration: number | null;
    dismissible: boolean;
    closeLabel: string;
    actionText: string;
    actionLabel: string;
    onAction: ToastShowOptions["onAction"];
    onClose: ToastShowOptions["onClose"];
}

function normalizeText(value: string | undefined): string {
    return value?.trim() ?? "";
}

function normalizeLimit(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;

    return Math.max(0, Math.floor(value));
}

function getDefaultPoliteness(variant: ToastVariant): ToastPoliteness {
    return variant === "danger" ? "assertive" : "polite";
}

function normalizeToastInput(
    input: ToastInput,
    defaults: Required<Pick<ToastViewportOptions, "dismissible" | "closeLabel">> & {
        duration: number | null;
        fallbackDescription: string;
    }
): ToastState {
    const options: ToastShowOptions = typeof input === "string"
        ? { description: input }
        : input;

    const variant = options.variant ?? "info";
    const title = normalizeText(options.title);
    let description = normalizeText(options.description);

    if (!title && !description) {
        description = defaults.fallbackDescription;
    }

    return {
        id: normalizeText(options.id) || createId("af-toast"),
        title,
        description,
        variant,
        politeness: options.politeness ?? getDefaultPoliteness(variant),
        duration: options.duration !== undefined ? options.duration : defaults.duration,
        dismissible: options.dismissible ?? defaults.dismissible,
        closeLabel: normalizeText(options.closeLabel) || defaults.closeLabel,
        actionText: normalizeText(options.actionText),
        actionLabel: normalizeText(options.actionLabel),
        onAction: options.onAction ?? null,
        onClose: options.onClose ?? null
    };
}

/**
 * Creates a toast notification viewport on an existing element.
 */
export function createToastViewport(
    element: HTMLElement,
    options: ToastViewportOptions = {}
): ToastViewport {
    const lifecycle = createComponentLifecycle(element, { name: "toast-viewport" });
    const ownerDocument = element.ownerDocument;
    const ownerWindow = ownerDocument.defaultView ?? window;

    const originalRole = element.getAttribute("role");
    const originalLabel = element.getAttribute("aria-label");
    const originalRelevant = element.getAttribute("aria-relevant");
    const originalPlacement = element.getAttribute("data-af-placement");

    let placement: ToastPlacement = options.placement ?? "bottom-end";
    let label = options.label;
    let limit = normalizeLimit(options.limit ?? null);
    let defaultDuration = options.duration ?? null;
    let defaultDismissible = options.dismissible ?? true;
    let defaultCloseLabel = options.closeLabel;
    let locale: ToastLocalization | null = options.locale ?? null;
    let unsubscribeLocale: (() => void) | null = null;
    let pauseOnHover = options.pauseOnHover ?? true;
    let newestOnTop = options.newestOnTop ?? true;
    let toasts: Toast[] = [];
    const announcedToasts = new Map<ToastPoliteness, Toast>();

    const announcer = createDocumentAnnouncementChannel({
        document: ownerDocument
    });

    function getViewportLabel(): string {
        return normalizeText(label) || getLocaleText(
            locale,
            "toast.label",
            accessibleFirstEnglishMessages["toast.label"]
        );
    }

    function getDefaultCloseLabel(): string {
        return normalizeText(defaultCloseLabel) || getLocaleText(
            locale,
            "toast.closeLabel",
            accessibleFirstEnglishMessages["toast.closeLabel"]
        );
    }

    function getCloseButtonText(): string {
        return getLocaleText(
            locale,
            "toast.closeButtonText",
            accessibleFirstEnglishMessages["toast.closeButtonText"]
        );
    }

    function getFallbackDescription(): string {
        return getLocaleText(
            locale,
            "toast.fallbackDescription",
            accessibleFirstEnglishMessages["toast.fallbackDescription"]
        );
    }

    function getAnnouncementText(state: ToastState): string {
        return [state.title, state.description]
            .filter(Boolean)
            .join(". ");
    }

    function announceToast(state: ToastState, toast: Toast): number | null {
        const message = getAnnouncementText(state);
        const politeness = state.politeness;

        if (!message) return null;

        return ownerWindow.setTimeout(() => {
            if (!toast.isClosed()) {
                announcedToasts.set(politeness, toast);
                announcer.announce(message, {
                    politeness
                });
            }
        }, 0);
    }

    function syncViewportAttributes(): void {
        element.setAttribute("role", "region");
        element.setAttribute("aria-label", getViewportLabel());
        element.setAttribute("aria-relevant", "additions text");
        element.setAttribute("data-af-placement", placement);
    }

    function applyLimit(): void {
        if (limit === null) return;

        while (toasts.length > limit) {
            const oldestFirst = newestOnTop ? [...toasts].reverse() : [...toasts];
            const toast = oldestFirst.find((candidate) => !candidate.element.contains(ownerDocument.activeElement));
            if (!toast) return;
            toast.close("limit");
        }
    }

    function removeToast(toast: Toast): void {
        toasts = toasts.filter((item) => item !== toast);
        for (const [politeness, owner] of announcedToasts) {
            if (owner !== toast) continue;

            announcedToasts.delete(politeness);
            announcer.clear({ politeness });
        }
    }

    function createToast(input: ToastInput): Toast {
        const state = normalizeToastInput(input, {
            duration: defaultDuration,
            dismissible: defaultDismissible,
            closeLabel: getDefaultCloseLabel(),
            fallbackDescription: getFallbackDescription()
        });

        const toastElement = ownerDocument.createElement("div");
        let toast!: Toast;
        let timerId: number | null = null;
        let announcementTimerId: number | null = null;
        let cleanups: Cleanup[] = [];
        let closed = false;
        let hovered = false;
        let previousFocus: HTMLElement | null = null;
        let restoringFocus = false;

        function containsFocus(): boolean {
            return toastElement.contains(ownerDocument.activeElement);
        }

        function clearAnnouncementTimer(): void {
            if (announcementTimerId === null) return;
            ownerWindow.clearTimeout(announcementTimerId);
            announcementTimerId = null;
        }

        function scheduleAnnouncement(): void {
            clearAnnouncementTimer();
            if (!closed) announcementTimerId = announceToast(state, toast);
        }

        function clearTimer(): void {
            if (timerId === null) return;

            ownerWindow.clearTimeout(timerId);
            timerId = null;
        }

        function scheduleTimer(duration: number | null = state.duration): void {
            clearTimer();

            if (closed || containsFocus() || (pauseOnHover && hovered) || duration === null || duration <= 0) {
                return;
            }

            timerId = ownerWindow.setTimeout(() => {
                toast.close("timeout");
            }, duration);
        }

        function disposeCleanups(): void {
            for (const cleanup of cleanups.splice(0)) {
                cleanup();
            }
        }

        function syncToastAttributes(): void {
            toastElement.id = state.id;
            toastElement.removeAttribute("role");
            toastElement.removeAttribute("aria-live");
            toastElement.removeAttribute("aria-atomic");
            toastElement.setAttribute("data-af-toast", "");
            toastElement.setAttribute("data-af-variant", state.variant);
        }

        function createButton(text: string, attribute: string): HTMLButtonElement {
            const button = ownerDocument.createElement("button");

            button.type = "button";
            button.textContent = text;
            button.setAttribute(attribute, "");

            return button;
        }

        function render(): void {
            const focused = containsFocus();
            const focusedAction = focused && ownerDocument.activeElement?.hasAttribute("data-af-toast-action");
            disposeCleanups();
            syncToastAttributes();
            toastElement.replaceChildren();

            const content = ownerDocument.createElement("div");
            content.setAttribute("data-af-toast-content", "");

            if (state.title) {
                const title = ownerDocument.createElement("strong");
                title.setAttribute("data-af-toast-title", "");
                title.textContent = state.title;
                content.append(title);
            }

            if (state.description) {
                const description = ownerDocument.createElement("p");
                description.setAttribute("data-af-toast-description", "");
                description.textContent = state.description;
                content.append(description);
            }

            toastElement.append(content);

            if (state.actionText || state.dismissible) {
                const actions = ownerDocument.createElement("div");
                actions.setAttribute("data-af-toast-actions", "");

                if (state.actionText) {
                    const action = createButton(state.actionText, "data-af-toast-action");

                    if (state.actionLabel) {
                        action.setAttribute("aria-label", state.actionLabel);
                    }

                    cleanups.push(addEventListener(action, "click", (event) => {
                        state.onAction?.(event, toast);

                        if (!event.defaultPrevented) {
                            toast.close("action");
                        }
                    }));

                    actions.append(action);
                }

                if (state.dismissible) {
                    const close = createButton(getCloseButtonText(), "data-af-toast-close");
                    close.setAttribute("aria-label", state.closeLabel);

                    cleanups.push(addEventListener(close, "click", () => {
                        toast.close("dismiss");
                    }));

                    actions.append(close);
                }

                toastElement.append(actions);
            }

            cleanups.push(
                addEventListener<PointerEvent>(toastElement, "pointerenter", () => {
                    hovered = true;
                    if (pauseOnHover) clearTimer();
                }),
                addEventListener<PointerEvent>(toastElement, "pointerleave", () => {
                    hovered = false;
                    if (pauseOnHover) scheduleTimer();
                }),
                addEventListener<FocusEvent>(toastElement, "focusin", (event) => {
                    if (!restoringFocus && isHTMLElement(event.relatedTarget) && !toastElement.contains(event.relatedTarget)) {
                        previousFocus = event.relatedTarget;
                    }
                    clearTimer();
                }),
                addEventListener<FocusEvent>(toastElement, "focusout", (event) => {
                    if (isHTMLElement(event.relatedTarget) && toastElement.contains(event.relatedTarget)) return;
                    scheduleTimer();
                    applyLimit();
                })
            );

            if (focused) {
                const selector = focusedAction ? "[data-af-toast-action]" : "[data-af-toast-close]";
                const next = toastElement.querySelector<HTMLElement>(selector)
                    ?? toastElement.querySelector<HTMLElement>("button")
                    ?? previousFocus;
                restoringFocus = true;
                try { focusElement(next); }
                finally { restoringFocus = false; }
            }
        }

        toast = {
            id: state.id,
            element: toastElement,

            close(reason: ToastCloseReason = "programmatic"): void {
                if (closed) return;

                closed = true;
                const restoreFocus = reason !== "destroy" && containsFocus();
                clearTimer();
                clearAnnouncementTimer();
                disposeCleanups();
                toastElement.remove();
                removeToast(toast);
                if (restoreFocus) focusElement(previousFocus);
                previousFocus = null;
                state.onClose?.(reason, toast);
            },

            update(nextOptions: ToastUpdateOptions): void {
                if (closed) return;

                if (nextOptions.title !== undefined) state.title = normalizeText(nextOptions.title);
                if (nextOptions.description !== undefined) state.description = normalizeText(nextOptions.description);
                if (nextOptions.variant !== undefined) state.variant = nextOptions.variant;
                if (nextOptions.politeness !== undefined) state.politeness = nextOptions.politeness;
                if ("duration" in nextOptions) state.duration = nextOptions.duration ?? null;
                if (nextOptions.dismissible !== undefined) state.dismissible = nextOptions.dismissible;
                if (nextOptions.closeLabel !== undefined) {
                    state.closeLabel = normalizeText(nextOptions.closeLabel) || getDefaultCloseLabel();
                }
                if (nextOptions.actionText !== undefined) state.actionText = normalizeText(nextOptions.actionText);
                if (nextOptions.actionLabel !== undefined) state.actionLabel = normalizeText(nextOptions.actionLabel);
                if ("onAction" in nextOptions) state.onAction = nextOptions.onAction ?? null;

                render();
                scheduleTimer();
                scheduleAnnouncement();
            },

            resetDuration(duration?: number | null): void {
                if (closed) return;

                if (duration !== undefined) {
                    state.duration = duration;
                }

                scheduleTimer();
            },

            isClosed(): boolean {
                return closed;
            }
        };

        render();
        scheduleTimer();
        scheduleAnnouncement();

        return toast;
    }

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        if (!locale?.subscribe) return;

        unsubscribeLocale = locale.subscribe(() => {
            if (!lifecycle.isDestroyed()) syncViewportAttributes();
        });
    }

    syncLocaleSubscription();
    syncViewportAttributes();

    lifecycle.addCleanup(() => {
        const unsubscribe = unsubscribeLocale;
        unsubscribeLocale = null;
        runCleanups([
            ...toasts.map((toast) => () => toast.close("destroy")),
            () => announcer.destroy(),
            () => unsubscribe?.(),
            () => {
                restoreAttribute(element, "role", originalRole);
                restoreAttribute(element, "aria-label", originalLabel);
                restoreAttribute(element, "aria-relevant", originalRelevant);
                restoreAttribute(element, "data-af-placement", originalPlacement);
            }
        ]);
    });

    return {
        element,
        viewport: element,

        show(input: ToastInput): Toast {
            if (lifecycle.isDestroyed()) {
                throw new Error("Cannot show a toast after the toast viewport was destroyed.");
            }

            const toast = createToast(input);

            if (newestOnTop) {
                toasts.unshift(toast);
                element.prepend(toast.element);
            } else {
                toasts.push(toast);
                element.append(toast.element);
            }

            applyLimit();

            return toast;
        },

        closeAll(reason: ToastCloseReason = "programmatic"): void {
            runCleanups(toasts.map((toast) => () => toast.close(reason)));
        },

        getToasts(): Toast[] {
            return [...toasts];
        },

        update(nextOptions: ToastViewportOptions): void {
            if (lifecycle.isDestroyed()) return;
            if (nextOptions.placement !== undefined) placement = nextOptions.placement;
            if ("label" in nextOptions) label = nextOptions.label;
            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                syncLocaleSubscription();
            }
            if ("limit" in nextOptions) limit = normalizeLimit(nextOptions.limit ?? null);
            if ("duration" in nextOptions) defaultDuration = nextOptions.duration ?? null;
            if (nextOptions.dismissible !== undefined) defaultDismissible = nextOptions.dismissible;
            if ("closeLabel" in nextOptions) {
                defaultCloseLabel = nextOptions.closeLabel;
            }
            if (nextOptions.pauseOnHover !== undefined) pauseOnHover = nextOptions.pauseOnHover;
            if (nextOptions.newestOnTop !== undefined) newestOnTop = nextOptions.newestOnTop;

            syncViewportAttributes();
            applyLimit();
            if (nextOptions.pauseOnHover !== undefined) {
                for (const toast of toasts) toast.resetDuration();
            }
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
