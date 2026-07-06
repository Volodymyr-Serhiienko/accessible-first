/**
 * Defines the allowed axis orientation for navigating a roving focus collection.
 */
export type RovingFocusOrientation = "horizontal" | "vertical" | "both";

/**
 * Configuration options for initializing a roving focus management instance.
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
 * Interface representing a roving focus management instance, used to handle 
 * keyboard navigation within accessible components like toolbars, menus, or grids.
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
