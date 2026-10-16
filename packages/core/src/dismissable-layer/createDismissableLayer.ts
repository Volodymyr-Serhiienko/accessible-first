import { getOwnerDocument } from "../dom";
import { addEventListener, type Cleanup } from "../events";
import { isEscapeKey } from "../keyboard";
import type {
    DismissableLayer,
    DismissableLayerBranch,
    DismissableLayerEvent,
    DismissableLayerOptions
} from "./types";
import type { OverlayStack, OverlayStackEntry } from "../overlay-stack";
import {
    getDocumentOverlayStack
} from "../overlay-stack/getDocumentOverlayStack";

// A top layer can close while the same native event is still visiting listeners.
const claimedEventsByStack = new WeakMap<OverlayStack, WeakSet<Event>>();

function resolveBranch(branch: DismissableLayerBranch): HTMLElement | null {
    return typeof branch === "function" ? branch() : branch ?? null;
}

function isNode(value: EventTarget | null): value is Node {
    return typeof value === "object" && value !== null && "nodeType" in value;
}

function eventTargetsElement(event: Event, element: HTMLElement): boolean {
    const path = event.composedPath();

    if (path.includes(element)) {
        return true;
    }

    return isNode(event.target) && (
        event.target === element ||
        element.contains(event.target)
    );
}

function createLayerEvent<TEvent extends Event>(
    originalEvent: TEvent
): DismissableLayerEvent<TEvent> {
    let defaultPrevented = false;

    return {
        originalEvent,
        target: originalEvent.target,

        preventDefault(): void {
            defaultPrevented = true;
            originalEvent.preventDefault();
        },

        isDefaultPrevented(): boolean {
            return defaultPrevented || originalEvent.defaultPrevented;
        }
    };
}

/**
 * Creates a dismissable layer for overlays.
 *
 * The layer listens for Escape, outside pointer interaction, and outside focus.
 * Branches can mark related DOM nodes as inside the layer.
 */
export function createDismissableLayer(
    element: HTMLElement,
    options: DismissableLayerOptions = {}
): DismissableLayer {
    const ownerDocument = getOwnerDocument(element);

    const useOverlayStack = options.useOverlayStack ?? true;
    const overlayStack = options.overlayStack ?? getDocumentOverlayStack(ownerDocument);

    const dismissOnEscape = options.dismissOnEscape ?? true;
    const dismissOnPointerDownOutside =
        options.dismissOnPointerDownOutside ?? true;
    const dismissOnFocusOutside = options.dismissOnFocusOutside ?? false;

    let active = false;
    let destroyed = false;
    let cleanups: Cleanup[] = [];
    let overlayEntry: OverlayStackEntry | null = null;
    let activationRevision = 0;
    const handledEvents = claimedEventsByStack.get(overlayStack) ?? new WeakSet<Event>();
    if (useOverlayStack) claimedEventsByStack.set(overlayStack, handledEvents);

    function canHandle(event: Event): boolean {
        return active && !destroyed && isTopLayer() && (!useOverlayStack || !handledEvents.has(event));
    }

    function isTopLayer(): boolean {
        if (!useOverlayStack || !overlayEntry) {
            return true;
        }

        return overlayStack.isTop(overlayEntry);
    }

    function getBranches(): HTMLElement[] {
        return (options.branches ?? [])
            .map(resolveBranch)
            .filter((branch): branch is HTMLElement => branch !== null);
    }

    function isEventInside(event: Event): boolean {
        if (eventTargetsElement(event, element)) {
            return true;
        }

        return getBranches().some((branch) => eventTargetsElement(event, branch));
    }

    function dismiss(revision: number): void {
        if (revision !== activationRevision || !active || destroyed || !isTopLayer()) return;
        options.onDismiss?.();
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (!canHandle(event) || event.defaultPrevented || event.isComposing
            || event.ctrlKey || event.altKey || event.metaKey || !isEscapeKey(event)) {
            return;
        }

        const layerEvent = createLayerEvent(event);
        const revision = activationRevision;
        if (useOverlayStack) handledEvents.add(event);

        options.onEscapeKeyDown?.(layerEvent);

        if (!layerEvent.isDefaultPrevented() && dismissOnEscape && active && !destroyed && isTopLayer() && revision === activationRevision) {
            event.preventDefault();
            dismiss(revision);
        }
    }

    function handlePointerDown(event: PointerEvent): void {
        const revision = activationRevision;
        if (!canHandle(event) || isEventInside(event) || !canHandle(event) || revision !== activationRevision) {
            return;
        }

        const layerEvent = createLayerEvent(event);
        if (useOverlayStack) handledEvents.add(event);

        options.onPointerDownOutside?.(layerEvent);

        if (!layerEvent.isDefaultPrevented() && dismissOnPointerDownOutside) {
            dismiss(revision);
        }
    }

    function handleFocusIn(event: FocusEvent): void {
        const revision = activationRevision;
        if (!canHandle(event) || isEventInside(event) || !canHandle(event) || revision !== activationRevision) {
            return;
        }

        const layerEvent = createLayerEvent(event);
        if (useOverlayStack) handledEvents.add(event);

        options.onFocusOutside?.(layerEvent);

        if (!layerEvent.isDefaultPrevented() && dismissOnFocusOutside) {
            dismiss(revision);
        }
    }

    function activate(): void {
        if (destroyed || active) {
            return;
        }

        active = true;
        activationRevision += 1;

        if (useOverlayStack) {
            overlayEntry = overlayStack.add(element);
        }

        cleanups = [
            addEventListener<KeyboardEvent>(
                ownerDocument,
                "keydown",
                handleKeyDown
            ),
            addEventListener<PointerEvent>(
                ownerDocument,
                "pointerdown",
                handlePointerDown,
                true
            ),
            addEventListener<FocusEvent>(
                ownerDocument,
                "focusin",
                handleFocusIn
            )
        ];
    }

    function deactivate(): void {
        if (!active) {
            return;
        }

        active = false;

        if (overlayEntry) {
            overlayStack.remove(overlayEntry);
            overlayEntry = null;
        }

        for (const cleanup of cleanups) {
            cleanup();
        }

        cleanups = [];
    }

    if (options.active !== false) {
        activate();
    }

    return {
        element,

        activate,

        deactivate,

        isActive(): boolean {
            return active;
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;
            deactivate();
        }
    };
}
