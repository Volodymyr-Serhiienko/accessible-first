import {
    setAriaAttribute,
    setAriaControls,
    setAriaDescribedBy,
    setAriaExpanded,
    setAriaLabelledBy,
    setRole
} from "../../../core/src/aria";
import {
    createDismissableLayer,
    type DismissableLayer,
    type DismissableLayerBranch,
    type DismissableLayerEvent,
    type DismissableLayerOptions
} from "../../../core/src/dismissable-layer";
import {
    getActiveElement,
    getOwnerDocument,
    getOwnerWindow,
    restoreAttribute
} from "../../../core/src/dom";
import { focusElement } from "../../../core/src/focus";
import { addEventListener, type Cleanup } from "../../../core/src/events";
import { createId } from "../../../core/src/id";
import {
    createPopoverPosition,
    type PopoverPosition,
    type PopoverPositionOptions,
    type PopoverPositionState
} from "../../../core/src/popover-position";
import { createComponentLifecycle } from "../foundation";
import {
    createAnnouncer,
    type Announcer,
    type LiveRegionPoliteness
} from "../../../core/src/live-region";
import type {
    Popover,
    PopoverAnnouncement,
    PopoverAnnouncementContext,
    PopoverAnnouncementMessage,
    PopoverHasPopup,
    PopoverOptions,
    PopoverRole,
    PopoverSize,
    PopoverUpdateOptions,
    PopoverVariant
} from "./types";

function getPositionOptions(options: PopoverOptions | PopoverUpdateOptions): PopoverPositionOptions {
    const positionOptions: PopoverPositionOptions = {};

    if (options.side !== undefined) positionOptions.side = options.side;
    if (options.alignment !== undefined) positionOptions.alignment = options.alignment;
    if (options.strategy !== undefined) positionOptions.strategy = options.strategy;
    if (options.offset !== undefined) positionOptions.offset = options.offset;
    if (options.crossAxisOffset !== undefined) positionOptions.crossAxisOffset = options.crossAxisOffset;
    if (options.collisionPadding !== undefined) positionOptions.collisionPadding = options.collisionPadding;
    if (options.flip !== undefined) positionOptions.flip = options.flip;
    if (options.shift !== undefined) positionOptions.shift = options.shift;
    if (options.matchAnchorWidth !== undefined) positionOptions.matchAnchorWidth = options.matchAnchorWidth;
    if (options.autoUpdate !== undefined) positionOptions.autoUpdate = options.autoUpdate;

    return positionOptions;
}

function hasPositionOption(options: PopoverUpdateOptions): boolean {
    return (
        options.side !== undefined
        || options.alignment !== undefined
        || options.strategy !== undefined
        || options.offset !== undefined
        || options.crossAxisOffset !== undefined
        || options.collisionPadding !== undefined
        || options.flip !== undefined
        || options.shift !== undefined
        || options.matchAnchorWidth !== undefined
        || options.autoUpdate !== undefined
    );
}

function mergePositionOptions(
    current: PopoverPositionOptions,
    next: PopoverUpdateOptions
): PopoverPositionOptions {
    return {
        ...current,
        ...getPositionOptions(next)
    };
}

function getHasPopupValue(
    role: PopoverRole,
    hasPopup: PopoverHasPopup | undefined
): PopoverHasPopup {
    if (hasPopup !== undefined) {
        return hasPopup;
    }

    return role;
}

function isAnchorVisible(anchor: HTMLElement): boolean {
    const rect = anchor.getBoundingClientRect();
    const ownerWindow = getOwnerWindow(anchor);

    return (
        rect.width > 0
        && rect.height > 0
        && rect.bottom > 0
        && rect.right > 0
        && rect.top < ownerWindow.innerHeight
        && rect.left < ownerWindow.innerWidth
    );
}

function normalizeAnnouncementText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function isAnnouncementOptions(
    value: PopoverAnnouncement
): value is Exclude<PopoverAnnouncement, boolean | string | PopoverAnnouncementMessage> {
    return Boolean(value && typeof value === "object");
}

function getContentText(content: HTMLElement): string {
    return normalizeAnnouncementText(content.textContent ?? "");
}

function resolveAnnouncementMessage(
    announcement: PopoverAnnouncement,
    context: PopoverAnnouncementContext
): string {
    if (announcement === true) return context.getContentText();
    if (typeof announcement === "string") return normalizeAnnouncementText(announcement);
    if (typeof announcement === "function") {
        return normalizeAnnouncementText(announcement(context) ?? "");
    }
    if (announcement === false) return "";

    const message = announcement.message;
    if (message === undefined) return context.getContentText();
    if (typeof message === "function") return normalizeAnnouncementText(message(context) ?? "");

    return normalizeAnnouncementText(message);
}

function getAnnouncementPoliteness(
    announcement: PopoverAnnouncement
): LiveRegionPoliteness {
    if (isAnnouncementOptions(announcement) && announcement.politeness !== undefined) {
        return announcement.politeness;
    }

    return "polite";
}

function isAnnouncementEnabled(announcement: PopoverAnnouncement): boolean {
    if (announcement === false) return false;
    if (isAnnouncementOptions(announcement) && announcement.enabled === false) return false;

    return true;
}

/**
 * Enhances an existing floating element with popover open state,
 * trigger wiring, dismiss behavior, overlay stacking, and positioning.
 */
export function createPopover(
    content: HTMLElement,
    options: PopoverOptions = {}
): Popover {
    const lifecycle = createComponentLifecycle(content, { name: "popover" });

    const originalId = content.getAttribute("id");
    const originalHidden = content.getAttribute("hidden");
    const originalRole = content.getAttribute("role");
    const originalLabelledBy = content.getAttribute("aria-labelledby");
    const originalDescribedBy = content.getAttribute("aria-describedby");
    const originalOpen = content.getAttribute("data-af-open");
    const originalVariant = content.getAttribute("data-af-variant");
    const originalSize = content.getAttribute("data-af-size");
    const originalSide = content.getAttribute("data-af-side");
    const originalAlignment = content.getAttribute("data-af-align");

    let trigger: HTMLElement | null = null;
    let triggerCleanup: Cleanup | null = null;
    let position: PopoverPosition | null = null;
    let positionOptions = getPositionOptions(options);
    let positionUpdateCleanups: Cleanup[] = [];
    let pendingPositionUpdateFrame: number | null = null;

    let open = options.open ?? options.defaultOpen ?? false;
    let disabled = options.disabled ?? false;
    let restoreFocus = options.restoreFocus ?? true;
    let closeOnAnchorHidden = options.closeOnAnchorHidden ?? true;
    let contentId = options.contentId;
    let role: PopoverRole = options.role ?? null;
    let hasPopup = options.hasPopup;
    let labelledBy = options.labelledBy;
    let describedBy = options.describedBy;
    let dismissOnEscape = options.dismissOnEscape ?? true;
    let dismissOnPointerDownOutside = options.dismissOnPointerDownOutside ?? true;
    let dismissOnFocusOutside = options.dismissOnFocusOutside ?? false;
    let variant: PopoverVariant = options.variant ?? "default";
    let size: PopoverSize = options.size ?? "md";
    let onEscapeKeyDown = options.onEscapeKeyDown ?? null;
    let onPointerDownOutside = options.onPointerDownOutside ?? null;
    let onFocusOutside = options.onFocusOutside ?? null;
    let onOpenChange = options.onOpenChange ?? null;
    let announcement = options.announcement;
    let announcer: Announcer | null = null;

    let popover!: Popover;

    const branches: DismissableLayerBranch[] = [];

    function ensureContentId(): string {
        if (contentId !== undefined && contentId !== null) {
            content.id = contentId;
            return content.id;
        }

        if (!content.id) {
            content.id = createId("af-popover");
        }

        return content.id;
    }

    function destroyPosition(): void {
        position?.destroy();
        position = null;
    }

    function getPositionBehaviorOptions(): PopoverPositionOptions {
        return {
            ...positionOptions,
            autoUpdate: false
        };
    }

    function cancelScheduledPositionUpdate(): void {
        if (pendingPositionUpdateFrame === null) return;

        getOwnerWindow(content).cancelAnimationFrame(pendingPositionUpdateFrame);
        pendingPositionUpdateFrame = null;
    }

    function disposePositionAutoUpdate(): void {
        cancelScheduledPositionUpdate();

        for (const cleanup of positionUpdateCleanups.splice(0)) {
            cleanup();
        }
    }

    function schedulePositionUpdate(): void {
        if (lifecycle.isDestroyed() || pendingPositionUpdateFrame !== null) {
            return;
        }

        pendingPositionUpdateFrame = getOwnerWindow(content).requestAnimationFrame(() => {
            pendingPositionUpdateFrame = null;
            updatePosition();
        });
    }

    function syncPositionAutoUpdate(): void {
        disposePositionAutoUpdate();

        if (!open || !trigger || positionOptions.autoUpdate === false) {
            return;
        }

        const ownerWindow = getOwnerWindow(trigger);
        const ownerDocument = getOwnerDocument(trigger);
        const scrollOptions: AddEventListenerOptions = {
            capture: true,
            passive: true
        };

        positionUpdateCleanups = [
            addEventListener<Event>(ownerWindow, "resize", schedulePositionUpdate),
            addEventListener<Event>(ownerWindow, "scroll", schedulePositionUpdate, true),
            addEventListener<Event>(ownerDocument, "scroll", schedulePositionUpdate, true),
            addEventListener<WheelEvent>(ownerWindow, "wheel", schedulePositionUpdate, scrollOptions),
            addEventListener<TouchEvent>(ownerWindow, "touchmove", schedulePositionUpdate, scrollOptions)
        ];
    }

    function updatePosition(): PopoverPositionState | null {
        if (!open || !trigger) {
            return position?.getState() ?? null;
        }

        if (closeOnAnchorHidden && !isAnchorVisible(trigger)) {
            syncOpenState(false);
            return null;
        }

        content.hidden = false;

        position ??= createPopoverPosition(trigger, content, getPositionBehaviorOptions());

        const state = position.update();

        content.setAttribute("data-af-side", state.side);
        content.setAttribute("data-af-align", state.alignment);

        return state;
    }

    function notifyOpenChange(): void {
        onOpenChange?.(
            {
                open,
                trigger,
                content
            },
            popover
        );
    }

    function shouldRestoreTriggerFocus(): boolean {
        if (!restoreFocus || !trigger) {
            return false;
        }

        const activeElement = getActiveElement(content);

        return activeElement === content || Boolean(activeElement && content.contains(activeElement));
    }

    function announceOpenContent(nextOpen: boolean): void {
        if (!nextOpen || announcement === undefined || !isAnnouncementEnabled(announcement)) {
            return;
        }

        const context: PopoverAnnouncementContext = {
            content,
            trigger,
            open: nextOpen,
            getContentText: () => getContentText(content)
        };

        const message = resolveAnnouncementMessage(announcement, context);

        if (!message) return;

        announcer ??= createAnnouncer({
            container: content.ownerDocument.body ?? content.ownerDocument.documentElement
        });

        announcer.announce(message, {
            politeness: getAnnouncementPoliteness(announcement)
        });
    }

    function syncTriggerAttributes(): void {
        if (!trigger) return;

        const popupValue = getHasPopupValue(role, hasPopup);

        if (popupValue === null) {
            trigger.removeAttribute("aria-haspopup");
        } else {
            setAriaAttribute(trigger, "aria-haspopup", popupValue);
        }

        setAriaControls(trigger, content);
        setAriaExpanded(trigger, open);
    }

    function syncContentAttributes(): void {
        content.hidden = !open;
        content.setAttribute("data-af-open", String(open));
        content.setAttribute("data-af-variant", variant);
        content.setAttribute("data-af-size", size);

        setRole(content, role);
        setAriaLabelledBy(content, labelledBy ?? null);
        setAriaDescribedBy(content, describedBy ?? null);

        if (trigger || contentId) {
            ensureContentId();
        }

        syncTriggerAttributes();
    }

    function syncOpenState(nextOpen: boolean, notify = true): void {
        if (lifecycle.isDestroyed()) return;

        let resolvedOpen = disabled ? false : nextOpen;

        if (resolvedOpen && closeOnAnchorHidden && trigger && !isAnchorVisible(trigger)) {
            resolvedOpen = false;
        }

        const changed = open !== resolvedOpen;
        const shouldRestoreFocus = open && !resolvedOpen && shouldRestoreTriggerFocus();

        open = resolvedOpen;
        syncContentAttributes();

        if (open) {
            layer.activate();
            updatePosition();
            syncPositionAutoUpdate();
        } else {
            disposePositionAutoUpdate();
            layer.deactivate();
            destroyPosition();

            if (shouldRestoreFocus) {
                focusElement(trigger, { preventScroll: true });
            }
        }

        if (changed && notify) {
            announceOpenContent(open);
            notifyOpenChange();
        }
    }

    function bindTrigger(nextTrigger: HTMLElement | null): void {
        triggerCleanup?.();
        triggerCleanup = null;
        trigger = nextTrigger;
        branches.length = 0;

        if (!trigger) {
            syncContentAttributes();
            return;
        }

        branches.push(trigger);

        const currentTrigger = trigger;
        const originalHasPopup = currentTrigger.getAttribute("aria-haspopup");
        const originalControls = currentTrigger.getAttribute("aria-controls");
        const originalExpanded = currentTrigger.getAttribute("aria-expanded");
        const originalTriggerMarker = currentTrigger.getAttribute("data-af-popover-trigger");

        currentTrigger.setAttribute("data-af-popover-trigger", "");
        syncTriggerAttributes();

        if (open) {
            destroyPosition();
            syncPositionAutoUpdate();
        }

        const cleanupClick = addEventListener<MouseEvent>(currentTrigger, "click", (event) => {
            if (disabled) return;

            event.preventDefault();
            syncOpenState(!open);
        });

        triggerCleanup = () => {
            cleanupClick();
            restoreAttribute(currentTrigger, "aria-haspopup", originalHasPopup);
            restoreAttribute(currentTrigger, "aria-controls", originalControls);
            restoreAttribute(currentTrigger, "aria-expanded", originalExpanded);
            restoreAttribute(currentTrigger, "data-af-popover-trigger", originalTriggerMarker);

            if (trigger === currentTrigger) {
                trigger = null;
            }
        };
    }

    const layerOptions: DismissableLayerOptions = {
        active: false,
        branches,
        dismissOnEscape: true,
        dismissOnPointerDownOutside: true,
        dismissOnFocusOutside: true,

        onEscapeKeyDown(event: DismissableLayerEvent<KeyboardEvent>): void {
            onEscapeKeyDown?.(event);

            if (!dismissOnEscape) {
                event.preventDefault();
            }
        },

        onPointerDownOutside(event: DismissableLayerEvent<PointerEvent>): void {
            onPointerDownOutside?.(event);

            if (!dismissOnPointerDownOutside) {
                event.preventDefault();
            }
        },

        onFocusOutside(event: DismissableLayerEvent<FocusEvent>): void {
            onFocusOutside?.(event);

            if (!dismissOnFocusOutside) {
                event.preventDefault();
            }
        },

        onDismiss(): void {
            syncOpenState(false);
        }
    };

    if (options.useOverlayStack !== undefined) {
        layerOptions.useOverlayStack = options.useOverlayStack;
    }

    if (options.overlayStack !== undefined) {
        layerOptions.overlayStack = options.overlayStack;
    }

    const layer: DismissableLayer = createDismissableLayer(content, layerOptions);

    bindTrigger(options.trigger ?? null);
    syncOpenState(open, false);

    lifecycle.addCleanup(() => {
        destroyPosition();
        restoreAttribute(content, "id", originalId);
        restoreAttribute(content, "hidden", originalHidden);
        restoreAttribute(content, "role", originalRole);
        restoreAttribute(content, "aria-labelledby", originalLabelledBy);
        restoreAttribute(content, "aria-describedby", originalDescribedBy);
        restoreAttribute(content, "data-af-open", originalOpen);
        restoreAttribute(content, "data-af-variant", originalVariant);
        restoreAttribute(content, "data-af-size", originalSize);
        restoreAttribute(content, "data-af-side", originalSide);
        restoreAttribute(content, "data-af-align", originalAlignment);
    });

    lifecycle.addCleanup(() => layer.destroy());
    lifecycle.addCleanup(() => disposePositionAutoUpdate());
    lifecycle.addCleanup(() => triggerCleanup?.());

    popover = {
        element: content,
        content,

        get trigger(): HTMLElement | null {
            return trigger;
        },

        open(): void {
            syncOpenState(true);
        },

        close(): void {
            syncOpenState(false);
        },

        toggle(): void {
            syncOpenState(!open);
        },

        setOpen(nextOpen): void {
            syncOpenState(nextOpen);
        },

        isOpen(): boolean {
            return open;
        },

        setDisabled(nextDisabled): void {
            if (lifecycle.isDestroyed()) return;

            disabled = nextDisabled;

            if (disabled) {
                syncOpenState(false);
            }
        },

        isDisabled(): boolean {
            return disabled;
        },

        updatePosition,

        getPositionState(): PopoverPositionState | null {
            return position?.getState() ?? null;
        },

        update(nextOptions): void {
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

            if ("contentId" in nextOptions) {
                contentId = nextOptions.contentId ?? null;
            }

            if ("role" in nextOptions) {
                role = nextOptions.role ?? null;
            }

            if ("hasPopup" in nextOptions) {
                hasPopup = nextOptions.hasPopup ?? null;
            }

            if ("labelledBy" in nextOptions) {
                labelledBy = nextOptions.labelledBy ?? null;
            }

            if ("describedBy" in nextOptions) {
                describedBy = nextOptions.describedBy ?? null;
            }

            if (nextOptions.dismissOnEscape !== undefined) {
                dismissOnEscape = nextOptions.dismissOnEscape;
            }

            if (nextOptions.dismissOnPointerDownOutside !== undefined) {
                dismissOnPointerDownOutside = nextOptions.dismissOnPointerDownOutside;
            }

            if (nextOptions.dismissOnFocusOutside !== undefined) {
                dismissOnFocusOutside = nextOptions.dismissOnFocusOutside;
            }

            if (nextOptions.variant !== undefined) {
                variant = nextOptions.variant;
            }

            if (nextOptions.size !== undefined) {
                size = nextOptions.size;
            }

            if (nextOptions.disabled !== undefined) {
                disabled = nextOptions.disabled;
            }

            if (nextOptions.restoreFocus !== undefined) {
                restoreFocus = nextOptions.restoreFocus;
            }

            if (nextOptions.closeOnAnchorHidden !== undefined) {
                closeOnAnchorHidden = nextOptions.closeOnAnchorHidden;
            }

            if (nextOptions.trigger !== undefined) {
                bindTrigger(nextOptions.trigger);
            }

            if (nextOptions.announcement !== undefined) {
                announcement = nextOptions.announcement;
            }

            if (hasPositionOption(nextOptions)) {
                positionOptions = mergePositionOptions(positionOptions, nextOptions);
                destroyPosition();

                if (open) {
                    syncPositionAutoUpdate();
                }
            }

            syncContentAttributes();

            if (nextOptions.open !== undefined) {
                syncOpenState(nextOptions.open);
                return;
            }

            if (disabled && open) {
                syncOpenState(false);
                return;
            }

            if (open) {
                updatePosition();
            }
        },

        destroy(): void {
            lifecycle.destroy();
            announcer?.destroy();
            announcer = null;
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };

    return popover;
}
