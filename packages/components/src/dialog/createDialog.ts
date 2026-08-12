import {
    setAriaAttribute,
    setAriaControls,
    setAriaDescribedBy,
    setAriaExpanded,
    setAriaLabelledBy,
    setAriaModal,
    setRole
} from "../../../core/src/aria";
import {
    createDialog as createDialogBehavior,
    type Dialog as CoreDialog,
    type DialogOptions as CoreDialogOptions
} from "../../../core/src/dialog";
import {
    createDismissableLayer,
    type DismissableLayer,
    type DismissableLayerBranch,
    type DismissableLayerOptions
} from "../../../core/src/dismissable-layer";
import { addEventListener, type Cleanup } from "../../../core/src/events";
import { createComponentLifecycle } from "../foundation";
import { restoreAttribute } from "../../../core/src/dom";
import { createScrollLock } from "../../../core/src/scroll";
import type {
    Dialog,
    DialogOptions,
    DialogSize,
    DialogUpdateOptions,
    DialogVariant
} from "./types";

function isHTMLElement(value: Element | null): value is HTMLElement {
    return value instanceof HTMLElement;
}

function getSurface(element: HTMLElement, options: DialogOptions): HTMLElement {
    if (options.surface) {
        return options.surface;
    }

    const surface = element.querySelector("[data-af-dialog-surface]");

    return isHTMLElement(surface) ? surface : element;
}

function getCoreDialogOptions(
    options: DialogOptions,
    onOpenChange: (open: boolean) => void
): CoreDialogOptions {
    const dialogOptions: CoreDialogOptions = {
        closeOnEscape: false,
        onOpenChange
    };

    const initialOpen = options.open ?? options.defaultOpen;

    if (initialOpen !== undefined) dialogOptions.defaultOpen = initialOpen;
    if (options.modal !== undefined) dialogOptions.modal = options.modal;
    if (options.trapFocus !== undefined) dialogOptions.trapFocus = options.trapFocus;
    if (options.restoreFocus !== undefined) dialogOptions.restoreFocus = options.restoreFocus;
    if (options.role !== undefined) dialogOptions.role = options.role;
    if (options.labelledBy !== undefined) dialogOptions.labelledBy = options.labelledBy;
    if (options.describedBy !== undefined) dialogOptions.describedBy = options.describedBy;
    if (options.initialFocus !== undefined) dialogOptions.initialFocus = options.initialFocus;
    if (options.fallbackFocus !== undefined) dialogOptions.fallbackFocus = options.fallbackFocus;

    return dialogOptions;
}

function hasAuthorAccessibleName(element: HTMLElement, fallbackLabelApplied: boolean): boolean {
    const labelledBy = element.getAttribute("aria-labelledby")?.trim();
    const label = element.getAttribute("aria-label")?.trim();

    return Boolean(labelledBy || (label && !fallbackLabelApplied));
}

function getFallbackAccessibleName(element: HTMLElement): string {
    return element.getAttribute("role") === "alertdialog"
        ? "Alert dialog"
        : "Dialog";
}

/**
 * Creates an accessible dialog component.
 *
 * It composes core dialog focus behavior with trigger wiring,
 * dismissable-layer handling, overlay stack support, and styling hooks.
 */
export function createDialog(
    element: HTMLElement,
    options: DialogOptions = {}
): Dialog {
    const lifecycle = createComponentLifecycle(element, {
        name: "dialog"
    });

    const surface = getSurface(element, options);

    const originalId = element.getAttribute("id");
    const originalAriaLabel = element.getAttribute("aria-label");
    const originalOpen = element.getAttribute("data-af-open");
    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalWarning = element.getAttribute("data-af-warning");
    const originalSurfaceMarker = surface.getAttribute("data-af-dialog-surface");

    let behavior!: CoreDialog;
    let layer!: DismissableLayer;
    let trigger: HTMLElement | null = null;
    let triggerCleanup: Cleanup | null = null;
    let closeCleanups: Cleanup[] = [];
    let fallbackLabelApplied = false;

    let variant: DialogVariant = options.variant ?? "default";
    let size: DialogSize = options.size ?? "md";
    let onOpenChange = options.onOpenChange ?? null;
    let onEscapeKeyDown = options.onEscapeKeyDown ?? null;
    let onPointerDownOutside = options.onPointerDownOutside ?? null;
    let onFocusOutside = options.onFocusOutside ?? null;
    let closeOnEscape = options.closeOnEscape ?? true;
    let dismissOnPointerDownOutside = options.dismissOnPointerDownOutside ?? true;
    let dismissOnFocusOutside = options.dismissOnFocusOutside ?? false;
    let modal = options.modal ?? true;
    let hasExplicitLockScroll = options.lockScroll !== undefined;
    let lockScroll = options.lockScroll ?? modal;

    const scrollLock = createScrollLock(element);

    const branches: DismissableLayerBranch[] = [];

    function syncAccessibleName(): void {
        if (hasAuthorAccessibleName(element, fallbackLabelApplied)) {
            element.removeAttribute("data-af-warning");
            return;
        }

        element.setAttribute("aria-label", getFallbackAccessibleName(element));
        element.setAttribute("data-af-warning", "missing-accessible-name");
        fallbackLabelApplied = true;
    }

    function syncTriggerAttributes(): void {
        if (!trigger) {
            return;
        }

        setAriaExpanded(trigger, behavior.isOpen());
    }

    function syncOpenAttributes(): void {
        const open = behavior.isOpen();

        element.setAttribute("data-af-open", String(open));
        syncTriggerAttributes();

        if (open && lockScroll) {
            scrollLock.activate();
        } else {
            scrollLock.deactivate();
        }

        if (open) {
            layer.activate();
        } else {
            layer.deactivate();
        }
    }

    function setOpen(nextOpen: boolean): void {
        if (lifecycle.isDestroyed()) {
            return;
        }

        behavior.setOpen(nextOpen);
        syncOpenAttributes();
    }

    function bindTrigger(nextTrigger: HTMLElement | null): void {
        triggerCleanup?.();
        triggerCleanup = null;
        trigger = nextTrigger;
        branches.length = 0;

        if (!trigger) {
            return;
        }

        branches.push(trigger);

        const currentTrigger = trigger;
        const originalHasPopup = currentTrigger.getAttribute("aria-haspopup");
        const originalControls = currentTrigger.getAttribute("aria-controls");
        const originalExpanded = currentTrigger.getAttribute("aria-expanded");

        setAriaAttribute(currentTrigger, "aria-haspopup", "dialog");
        setAriaControls(currentTrigger, element);
        setAriaExpanded(currentTrigger, behavior.isOpen());

        const cleanupClick = addEventListener<MouseEvent>(currentTrigger, "click", (event) => {
            event.preventDefault();
            setOpen(true);
        });

        triggerCleanup = () => {
            cleanupClick();
            restoreAttribute(currentTrigger, "aria-haspopup", originalHasPopup);
            restoreAttribute(currentTrigger, "aria-controls", originalControls);
            restoreAttribute(currentTrigger, "aria-expanded", originalExpanded);

            if (trigger === currentTrigger) {
                trigger = null;
            }
        };
    }

    function bindCloseElements(elements: HTMLElement[]): void {
        for (const cleanup of closeCleanups) {
            cleanup();
        }

        closeCleanups = elements.map((closeElement) => (
            addEventListener<MouseEvent>(closeElement, "click", (event) => {
                event.preventDefault();
                setOpen(false);
            })
        ));
    }

    function syncStaticAttributes(): void {
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        if (surface !== element) {
            surface.setAttribute("data-af-dialog-surface", "");
        }
    }

    syncStaticAttributes();

    behavior = createDialogBehavior(
        element,
        getCoreDialogOptions(options, (open) => {
            syncOpenAttributes();
            onOpenChange?.(open);
        })
    );

    const layerOptions: DismissableLayerOptions = {
        active: false,
        branches,
        dismissOnEscape: true,
        dismissOnPointerDownOutside: true,
        dismissOnFocusOutside: true,

        onEscapeKeyDown(event) {
            onEscapeKeyDown?.(event);

            if (!closeOnEscape) {
                event.preventDefault();
            }
        },

        onPointerDownOutside(event) {
            onPointerDownOutside?.(event);

            if (!dismissOnPointerDownOutside) {
                event.preventDefault();
            }
        },

        onFocusOutside(event) {
            onFocusOutside?.(event);

            if (!dismissOnFocusOutside) {
                event.preventDefault();
            }
        },

        onDismiss() {
            setOpen(false);
        }
    };

    if (options.useOverlayStack !== undefined) {
        layerOptions.useOverlayStack = options.useOverlayStack;
    }

    if (options.overlayStack !== undefined) {
        layerOptions.overlayStack = options.overlayStack;
    }

    layer = createDismissableLayer(surface, layerOptions);

    bindTrigger(options.trigger ?? null);
    bindCloseElements(options.closeElements ?? []);

    syncAccessibleName();
    syncOpenAttributes();

    lifecycle.addCleanup(() => {
        restoreAttribute(element, "id", originalId);
        restoreAttribute(element, "aria-label", originalAriaLabel);
        restoreAttribute(element, "data-af-open", originalOpen);
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "data-af-warning", originalWarning);
        restoreAttribute(surface, "data-af-dialog-surface", originalSurfaceMarker);
    });

    lifecycle.addCleanup(() => behavior.destroy());
    lifecycle.addCleanup(() => layer.destroy());
    lifecycle.addCleanup(() => triggerCleanup?.());
    lifecycle.addCleanup(() => {
        for (const cleanup of closeCleanups) {
            cleanup();
        }

        closeCleanups = [];
    });
    lifecycle.addCleanup(() => scrollLock.destroy());

    return {
        element,

        get trigger(): HTMLElement | null {
            return trigger;
        },

        surface,

        open(): void {
            setOpen(true);
        },

        close(): void {
            setOpen(false);
        },

        toggle(): void {
            setOpen(!behavior.isOpen());
        },

        setOpen,

        isOpen(): boolean {
            return behavior.isOpen();
        },

        update(nextOptions: DialogUpdateOptions): void {
            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if ("onEscapeKeyDown" in nextOptions) {
                onEscapeKeyDown = nextOptions.onEscapeKeyDown ?? null;
            }

            if ("onPointerDownOutside" in nextOptions) {
                onPointerDownOutside = nextOptions.onPointerDownOutside ?? null;
            }

            if ("onFocusOutside" in nextOptions) {
                onFocusOutside = nextOptions.onFocusOutside ?? null;
            }

            if (nextOptions.closeOnEscape !== undefined) {
                closeOnEscape = nextOptions.closeOnEscape;
            }

            if (nextOptions.dismissOnPointerDownOutside !== undefined) {
                dismissOnPointerDownOutside = nextOptions.dismissOnPointerDownOutside;
            }

            if (nextOptions.dismissOnFocusOutside !== undefined) {
                dismissOnFocusOutside = nextOptions.dismissOnFocusOutside;
            }

            if (nextOptions.variant !== undefined) {
                variant = nextOptions.variant;
                syncStaticAttributes();
            }

            if (nextOptions.size !== undefined) {
                size = nextOptions.size;
                syncStaticAttributes();
            }

            if (nextOptions.role !== undefined) {
                setRole(element, nextOptions.role);
                syncAccessibleName();
            }

            if (nextOptions.modal !== undefined) {
                modal = nextOptions.modal;

                if (!hasExplicitLockScroll) {
                    lockScroll = modal;
                }

                setAriaModal(element, modal ? true : null);
                syncOpenAttributes();
            }

            if (nextOptions.lockScroll !== undefined) {
                hasExplicitLockScroll = true;
                lockScroll = nextOptions.lockScroll;
                syncOpenAttributes();
            }

            if (nextOptions.labelledBy !== undefined) {
                setAriaLabelledBy(element, nextOptions.labelledBy);
                syncAccessibleName();
            }

            if (nextOptions.describedBy !== undefined) {
                setAriaDescribedBy(element, nextOptions.describedBy);
            }

            if (nextOptions.trigger !== undefined) {
                bindTrigger(nextOptions.trigger);
                syncTriggerAttributes();
            }

            if (nextOptions.closeElements !== undefined) {
                bindCloseElements(nextOptions.closeElements);
            }

            if (nextOptions.open !== undefined) {
                setOpen(nextOptions.open);
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
