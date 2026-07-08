/**
 * Represents the primary boundary side where the popover content box is placed relative to its anchor element.
 */
export type PopoverPositionSide = "top" | "right" | "bottom" | "left";

/**
 * Determines the alignment of the popover content box along the cross-axis of the chosen side.
 */
export type PopoverPositionAlignment = "start" | "center" | "end";

/**
 * The CSS positioning strategy used to anchor the popover overlay element layout context.
 */
export type PopoverPositionStrategy = "absolute" | "fixed";

/**
 * Configuration criteria for calculating spatial layout positions of a floating popover overlay.
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
 * Represents the resolved layout measurements and structural states computed for the popover element.
 */
export interface PopoverPositionState {
    side: PopoverPositionSide;
    alignment: PopoverPositionAlignment;
    x: number;
    y: number;
}

/**
 * Interface representing a managed floating popover engine layout manager.
 * Orchestrates real-time boundary computations, geometric collision mitigation logic, 
 * and absolute coordinate positioning calculations relative to a DOM target block.
 */
export interface PopoverPosition {
    update(): PopoverPositionState;
    getState(): PopoverPositionState | null;
    destroy(): void;
}
