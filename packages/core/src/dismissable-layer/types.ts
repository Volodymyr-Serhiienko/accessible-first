import type { OverlayStack } from "../overlay-stack";

/**
 * Related element that should count as inside a dismissable layer.
 */
export type DismissableLayerBranch =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Event wrapper passed to outside-interaction callbacks.
 */
export interface DismissableLayerEvent<TEvent extends Event = Event> {
    readonly originalEvent: TEvent;
    readonly target: EventTarget | null;
    preventDefault(): void;
    isDefaultPrevented(): boolean;
}

/**
 * Options for createDismissableLayer().
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
 * Controller returned by createDismissableLayer().
 */
export interface DismissableLayer {
    readonly element: HTMLElement;
    activate(): void;
    deactivate(): void;
    isActive(): boolean;
    destroy(): void;
}
