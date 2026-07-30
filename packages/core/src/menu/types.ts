/**
 * Menu orientation used by arrow-key navigation.
 */
export type MenuOrientation = "vertical" | "horizontal";

/**
 * Menu item reference.
 */
export type MenuItem =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Options for createMenu().
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
 * Controller returned by createMenu().
 */
export interface Menu {
    readonly element: HTMLElement;
    getCurrentItem(): HTMLElement | null;
    setCurrentItem(item: HTMLElement | null, options?: { focus?: boolean }): boolean;
    refresh(): void;
    destroy(): void;
}
