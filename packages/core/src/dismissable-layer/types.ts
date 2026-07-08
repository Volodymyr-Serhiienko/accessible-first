import type { OverlayStack } from "../overlay-stack";

/**
 * A proxy reference resolving to an external container branch that should be treated 
 * as part of the layer. Interactions within a branch will not trigger dismiss cycles.
 */
export type DismissableLayerBranch =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Custom synthetic event wrapper that intercepts interactions outside or within 
 * the layer, permitting consumers to dynamically prevent default dismissal behavior.
 * * @template TEvent - The native DOM event model type being intercepted.
 */
export interface DismissableLayerEvent<TEvent extends Event = Event> {
    readonly originalEvent: TEvent;
    readonly target: EventTarget | null;
    preventDefault(): void;
    isDefaultPrevented(): boolean;
}

/**
 * Configuration options for initializing a contextual layout overlay layer 
 * that can be dismissed via keyboard or outside user interaction.
 */
export interface DismissableLayerOptions {
    active?: boolean;
    branches?: DismissableLayerBranch[];
    useOverlayStack?: boolean;
    overlayStack?: OverlayStack;
    dismissOnEscape?: boolean;
    dismissOnPointerDownOutside?: boolean;
    dismissOnFocusOutside?: boolean;
    onEscapeKeyDown?: (event: DismissableLayerEvent<KeyboardEvent>) => void;
    onPointerDownOutside?: (event: DismissableLayerEvent<PointerEvent>) => void;
    onFocusOutside?: (event: DismissableLayerEvent<FocusEvent>) => void;
    onDismiss?: () => void;
}

/**
 * Interface representing a managed surface overlay layer (such as modals, tooltips, popovers, or dropdowns)
 * that intercepts key or interaction cycles to conditionally trigger closure hooks.
 */
export interface DismissableLayer {
    readonly element: HTMLElement;
    activate(): void;
    deactivate(): void;
    isActive(): boolean;
    destroy(): void;
}
