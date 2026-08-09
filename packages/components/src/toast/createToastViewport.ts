import { restoreAttribute } from "../../../core/src/dom";
import { addEventListener, type Cleanup } from "../../../core/src/events";
import { createId } from "../../../core/src/id";
import { createComponentLifecycle } from "../foundation";
import { createAnnouncer } from "../../../core/src/live-region";
import type {
    Toast,
    ToastCloseReason,
    ToastInput,
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
    }
): ToastState {
    const options: ToastShowOptions = typeof input === "string"
        ? { description: input }
        : input;

    const variant = options.variant ?? "info";
    const title = normalizeText(options.title);
    let description = normalizeText(options.description);

    if (!title && !description) {
        description = "Notification";
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
    let label = normalizeText(options.label) || "Notifications";
    let limit = normalizeLimit(options.limit ?? null);
    let defaultDuration = options.duration ?? null;
    let defaultDismissible = options.dismissible ?? true;
    let defaultCloseLabel = normalizeText(options.closeLabel) || "Dismiss notification";
    let pauseOnHover = options.pauseOnHover ?? true;
    let newestOnTop = options.newestOnTop ?? true;
    let toasts: Toast[] = [];

    const announcer = createAnnouncer({ container: element });

    function getAnnouncementText(state: ToastState): string {
        return [state.title, state.description]
            .filter(Boolean)
            .join(". ");
    }

    function announceToast(state: ToastState, toast: Toast): void {
        const message = getAnnouncementText(state);

        if (!message) return;

        ownerWindow.setTimeout(() => {
            if (!toast.isClosed()) {
                announcer.announce(message, {
                    politeness: state.politeness
                });
            }
        }, 0);
    }

    function syncViewportAttributes(): void {
        element.setAttribute("role", "region");
        element.setAttribute("aria-label", label);
        element.setAttribute("aria-relevant", "additions text");
        element.setAttribute("data-af-placement", placement);
    }

    function applyLimit(): void {
        if (limit === null) return;

        while (toasts.length > limit) {
            const toast = newestOnTop ? toasts[toasts.length - 1] : toasts[0];
            toast?.close("limit");
        }
    }

    function removeToast(toast: Toast): void {
        toasts = toasts.filter((item) => item !== toast);
    }

    function createToast(input: ToastInput): Toast {
        const state = normalizeToastInput(input, {
            duration: defaultDuration,
            dismissible: defaultDismissible,
            closeLabel: defaultCloseLabel
        });

        const toastElement = ownerDocument.createElement("div");
        let toast!: Toast;
        let timerId: number | null = null;
        let cleanups: Cleanup[] = [];
        let closed = false;

        function clearTimer(): void {
            if (timerId === null) return;

            ownerWindow.clearTimeout(timerId);
            timerId = null;
        }

        function scheduleTimer(duration: number | null = state.duration): void {
            clearTimer();

            if (duration === null || duration <= 0) {
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
                    const close = createButton("Close", "data-af-toast-close");
                    close.setAttribute("aria-label", state.closeLabel);

                    cleanups.push(addEventListener(close, "click", () => {
                        toast.close("dismiss");
                    }));

                    actions.append(close);
                }

                toastElement.append(actions);
            }

            if (pauseOnHover) {
                cleanups.push(
                    addEventListener<PointerEvent>(toastElement, "pointerenter", () => clearTimer()),
                    addEventListener<PointerEvent>(toastElement, "pointerleave", () => scheduleTimer())
                );
            }
        }

        toast = {
            id: state.id,
            element: toastElement,

            close(reason: ToastCloseReason = "programmatic"): void {
                if (closed) return;

                closed = true;
                clearTimer();
                disposeCleanups();
                toastElement.remove();
                removeToast(toast);
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
                    state.closeLabel = normalizeText(nextOptions.closeLabel) || defaultCloseLabel;
                }
                if (nextOptions.actionText !== undefined) state.actionText = normalizeText(nextOptions.actionText);
                if (nextOptions.actionLabel !== undefined) state.actionLabel = normalizeText(nextOptions.actionLabel);
                if ("onAction" in nextOptions) state.onAction = nextOptions.onAction ?? null;

                render();
                scheduleTimer();
                announceToast(state, toast);
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
        announceToast(state, toast);

        return toast;
    }

    syncViewportAttributes();

    lifecycle.addCleanup(() => {
        for (const toast of [...toasts]) {
            toast.close("destroy");
        }

        announcer.destroy();

        restoreAttribute(element, "role", originalRole);
        restoreAttribute(element, "aria-label", originalLabel);
        restoreAttribute(element, "aria-relevant", originalRelevant);
        restoreAttribute(element, "data-af-placement", originalPlacement);
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
            for (const toast of [...toasts]) {
                toast.close(reason);
            }
        },

        getToasts(): Toast[] {
            return [...toasts];
        },

        update(nextOptions: ToastViewportOptions): void {
            if (nextOptions.placement !== undefined) placement = nextOptions.placement;
            if (nextOptions.label !== undefined) label = normalizeText(nextOptions.label) || "Notifications";
            if ("limit" in nextOptions) limit = normalizeLimit(nextOptions.limit ?? null);
            if ("duration" in nextOptions) defaultDuration = nextOptions.duration ?? null;
            if (nextOptions.dismissible !== undefined) defaultDismissible = nextOptions.dismissible;
            if (nextOptions.closeLabel !== undefined) {
                defaultCloseLabel = normalizeText(nextOptions.closeLabel) || "Dismiss notification";
            }
            if (nextOptions.pauseOnHover !== undefined) pauseOnHover = nextOptions.pauseOnHover;
            if (nextOptions.newestOnTop !== undefined) newestOnTop = nextOptions.newestOnTop;

            syncViewportAttributes();
            applyLimit();
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
