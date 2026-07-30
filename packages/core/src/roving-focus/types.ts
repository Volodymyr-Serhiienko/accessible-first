/**
 * Axis used by arrow-key navigation.
 */
export type RovingFocusOrientation = "horizontal" | "vertical" | "both";

/**
 * Options for createRovingFocus().
 */
export interface RovingFocusOptions {
    getItems: () => HTMLElement[];
    orientation?: RovingFocusOrientation;
    loop?: boolean;
    currentItem?: HTMLElement | (() => HTMLElement | null) | null;
    focusOnActivate?: boolean;
    isItemDisabled?: (item: HTMLElement) => boolean;
}

/**
 * Controller for roving tabindex navigation.
 */
export interface RovingFocus {
    activate(): void;
    deactivate(): void;
    refresh(): void;
    moveFirst(): boolean;
    moveLast(): boolean;
    moveNext(): boolean;
    movePrevious(): boolean;
    setCurrentItem(item: HTMLElement | null, options?: { focus?: boolean }): boolean;
    getCurrentItem(): HTMLElement | null;
    isActive(): boolean;
}
