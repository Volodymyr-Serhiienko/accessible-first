import {
    createMenu as createMenuBehavior,
    type MenuOptions as CoreMenuOptions
} from "../../../core/src/menu";
import { restoreAttribute } from "../../../core/src/dom";
import { createComponentLifecycle } from "../foundation";
import type { Menu, MenuOptions, MenuSize, MenuUpdateOptions, MenuVariant } from "./types";

function getCoreMenuOptions(
    options: MenuOptions,
    onSelect: (item: HTMLElement, event: Event) => void,
    onClose: () => void
): CoreMenuOptions {
    const coreOptions: CoreMenuOptions = {
        getItems: options.getItems,
        onSelect,
        onClose
    };

    if (options.orientation !== undefined) coreOptions.orientation = options.orientation;
    if (options.loop !== undefined) coreOptions.loop = options.loop;
    if (options.defaultItem !== undefined) coreOptions.defaultItem = options.defaultItem;
    if (options.typeahead !== undefined) coreOptions.typeahead = options.typeahead;
    if (options.typeaheadTimeout !== undefined) coreOptions.typeaheadTimeout = options.typeaheadTimeout;
    if (options.getItemText !== undefined) coreOptions.getItemText = options.getItemText;
    if (options.isItemDisabled !== undefined) coreOptions.isItemDisabled = options.isItemDisabled;
    if (options.closeOnSelect !== undefined) coreOptions.closeOnSelect = options.closeOnSelect;

    return coreOptions;
}

/**
 * Enhances an existing element with Accessible First menu behavior.
 *
 * The component layer adds styling/debug attributes and lifecycle cleanup while
 * the core menu module manages roles, roving focus, typeahead, selection, and
 * Escape close handling.
 */
export function createMenu(element: HTMLElement, options: MenuOptions): Menu {
    const lifecycle = createComponentLifecycle(element, { name: "menu" });

    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalOrientation = element.getAttribute("data-af-orientation");

    const orientation = options.orientation ?? "vertical";

    let variant: MenuVariant = options.variant ?? "default";
    let size: MenuSize = options.size ?? "md";
    let onSelect = options.onSelect ?? null;
    let onClose = options.onClose ?? null;

    const coreOptions = getCoreMenuOptions(
        options,
        (item, event) => onSelect?.(item, event),
        () => onClose?.()
    );

    const menu = createMenuBehavior(element, coreOptions);

    function syncAttributes(): void {
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-orientation", orientation);
    }

    syncAttributes();

    lifecycle.addCleanup(() => {
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "data-af-orientation", originalOrientation);
    });

    lifecycle.addCleanup(() => menu.destroy());

    return {
        element,
        menu: element,

        getCurrentItem: menu.getCurrentItem,
        setCurrentItem: menu.setCurrentItem,
        refresh: menu.refresh,

        update(nextOptions: MenuUpdateOptions): void {
            if ("onSelect" in nextOptions) {
                onSelect = nextOptions.onSelect ?? null;
            }

            if ("onClose" in nextOptions) {
                onClose = nextOptions.onClose ?? null;
            }

            if (nextOptions.getItems !== undefined) coreOptions.getItems = nextOptions.getItems;
            if (nextOptions.getItemText !== undefined) coreOptions.getItemText = nextOptions.getItemText;
            if (nextOptions.isItemDisabled !== undefined) coreOptions.isItemDisabled = nextOptions.isItemDisabled;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            syncAttributes();
            menu.refresh();
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
