/**
 * Specifies the visual layout alignment of the menu.
 * Determines whether horizontal or vertical arrow keys drive item navigation.
 */
export type MenuOrientation = "vertical" | "horizontal";

/**
 * A proxy reference resolving to a single menu item element.
 * Can be a direct `HTMLElement`, a dynamic factory function, or null.
 */
export type MenuItem =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Configuration options for initializing an accessible menu component manager.
 */
export interface MenuOptions {
    getItems: () => HTMLElement[];
    orientation?: MenuOrientation;
    loop?: boolean;
    defaultItem?: MenuItem;
    typeahead?: boolean;
    typeaheadTimeout?: number;
    getItemText?: (item: HTMLElement) => string;
    isItemDisabled?: (item: HTMLElement) => boolean;
    closeOnSelect?: boolean;
    onSelect?: (item: HTMLElement, event: Event) => void;
    onClose?: () => void;
}

/**
 * Interface representing a managed accessible navigation or action menu instance.
 * Coordinates roving focus, typeahead lookup buffers, and conditional sub-element activation rules
 * in alignment with WAI-ARIA Menu and Menubar design patterns.
 */
export interface Menu {
    readonly element: HTMLElement;
    getCurrentItem(): HTMLElement | null;
    setCurrentItem(item: HTMLElement | null, options?: { focus?: boolean }): boolean;
    refresh(): void;
    destroy(): void;
}
