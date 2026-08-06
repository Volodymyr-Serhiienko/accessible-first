import type {
    MenuItem as CoreMenuItem,
    MenuOptions as CoreMenuOptions,
    MenuOrientation as CoreMenuOrientation
} from "../../../core/src/menu";
import type { Component } from "../foundation";

/**
 * Visual variant for menu.
 */
export type MenuVariant = "default" | "plain";

/**
 * Menu size token.
 */
export type MenuSize = "md";

/**
 * Orientation used by menu arrow-key navigation.
 */
export type MenuOrientation = CoreMenuOrientation;

/**
 * Menu item reference used for initial focus.
 */
export type MenuItem = CoreMenuItem;

/**
 * Called when a menu item is activated.
 */
export type MenuOnSelect = (item: HTMLElement, event: Event) => void;

/**
 * Called when the menu asks its owner to close.
 */
export type MenuOnClose = () => void;

/**
 * Options for createMenu().
 */
export interface MenuOptions extends Omit<CoreMenuOptions, "onSelect" | "onClose"> {
    variant?: MenuVariant;
    size?: MenuSize;
    onSelect?: MenuOnSelect | null;
    onClose?: MenuOnClose | null;
}

/**
 * Options accepted by menu.update().
 *
 * Orientation, loop, typeahead, closeOnSelect, and other keyboard wiring options
 * are creation-time options because core menu behavior captures them on setup.
 */
export interface MenuUpdateOptions
    extends Partial<
        Omit<
            MenuOptions,
            | "orientation"
            | "loop"
            | "defaultItem"
            | "typeahead"
            | "typeaheadTimeout"
            | "closeOnSelect"
        >
    > {}

/**
 * Menu component controller returned by createMenu().
 */
export interface Menu extends Component {
    readonly menu: HTMLElement;
    getCurrentItem(): HTMLElement | null;
    setCurrentItem(item: HTMLElement | null, options?: { focus?: boolean }): boolean;
    refresh(): void;
    update(options: MenuUpdateOptions): void;
}
