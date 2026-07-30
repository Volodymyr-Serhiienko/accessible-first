/**
 * Side where the floating element is placed.
 */
export type PopoverPositionSide = "top" | "right" | "bottom" | "left";

/**
 * Cross-axis alignment for the floating element.
 */
export type PopoverPositionAlignment = "start" | "center" | "end";

/**
 * CSS positioning strategy.
 */
export type PopoverPositionStrategy = "absolute" | "fixed";

/**
 * Options for createPopoverPosition().
 */
export interface PopoverPositionOptions {
    side?: PopoverPositionSide;
    alignment?: PopoverPositionAlignment;
    strategy?: PopoverPositionStrategy;
    offset?: number;
    crossAxisOffset?: number;
    collisionPadding?: number;
    flip?: boolean;
    shift?: boolean;
    matchAnchorWidth?: boolean;
    autoUpdate?: boolean;
}

/**
 * Last computed floating position.
 */
export interface PopoverPositionState {
    side: PopoverPositionSide;
    alignment: PopoverPositionAlignment;
    x: number;
    y: number;
}

/**
 * Controller returned by createPopoverPosition().
 */
export interface PopoverPosition {
    update(): PopoverPositionState;
    getState(): PopoverPositionState | null;
    destroy(): void;
}
