import { getOwnerDocument } from "../dom";
import { addEventListener, type Cleanup } from "../events";
import { isEscapeKey } from "../keyboard";
import type {
    DismissableLayer,
    DismissableLayerBranch,
    DismissableLayerEvent,
    DismissableLayerOptions
} from "./types";

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
 * Creates and initializes a managed dismissable overlay layer surface wrapper.
 * Dynamically binds global window/document events to trap interactions such as outside cursor clicks, 
 * focus changes, or Escape key combinations. Includes branch matching logic to declare external, 
 * structurally unlinked DOM structures (like detached popovers or portals) as safe interactive targets.
 *
 * @param element - The core parent container HTMLElement acting as the primary boundary layer.
 * @param options - Event interception rules, bypass branch nodes lists, and conditional cancellation hooks.
 * @returns A DismissableLayer context manager allowing explicit lifecycle activation shifts and teardowns.
 */
export function createDismissableLayer(
    element: HTMLElement,
    options: DismissableLayerOptions = {}
): DismissableLayer {
    const ownerDocument = getOwnerDocument(element);

    const dismissOnEscape = options.dismissOnEscape ?? true;
    const dismissOnPointerDownOutside =
        options.dismissOnPointerDownOutside ?? true;
    const dismissOnFocusOutside = options.dismissOnFocusOutside ?? false;

    let active = false;
    let destroyed = false;
    let cleanups: Cleanup[] = [];

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

    function dismiss(): void {
        options.onDismiss?.();
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (!active || !isEscapeKey(event)) {
            return;
        }

        const layerEvent = createLayerEvent(event);

        options.onEscapeKeyDown?.(layerEvent);

        if (!layerEvent.isDefaultPrevented() && dismissOnEscape) {
            event.preventDefault();
            dismiss();
        }
    }

    function handlePointerDown(event: PointerEvent): void {
        if (!active || isEventInside(event)) {
            return;
        }

        const layerEvent = createLayerEvent(event);

        options.onPointerDownOutside?.(layerEvent);

        if (!layerEvent.isDefaultPrevented() && dismissOnPointerDownOutside) {
            dismiss();
        }
    }

    function handleFocusIn(event: FocusEvent): void {
        if (!active || isEventInside(event)) {
            return;
        }

        const layerEvent = createLayerEvent(event);

        options.onFocusOutside?.(layerEvent);

        if (!layerEvent.isDefaultPrevented() && dismissOnFocusOutside) {
            dismiss();
        }
    }

    function activate(): void {
        if (destroyed || active) {
            return;
        }

        active = true;

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
