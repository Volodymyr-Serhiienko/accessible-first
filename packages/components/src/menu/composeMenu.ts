import { createId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent
} from "../composition";
import { createHoverAnnouncement } from "../foundation";
import { createMenu as createMenuComponent } from "./createMenu";
import type {
    Menu as MenuInstance,
    MenuOptions as MenuInstanceOptions,
    MenuOrientation,
    MenuSize,
    MenuUpdateOptions as MenuInstanceUpdateOptions,
    MenuVariant
} from "./types";

/**
 * Content accepted by menu item labels.
 */
export type MenuCompositionContent = CompositionContent;

/**
 * Details passed when a composed menu item is activated.
 */
export interface MenuCompositionSelectDetail {
    value: string;
    item: HTMLElement;
    menuItem: ComposedMenuItem;
    event: Event;
    text: string;
}

/**
 * Called when one composed menu item is activated.
 */
export type MenuCompositionItemOnSelect = (
    detail: MenuCompositionSelectDetail,
    menu: ComposedMenu
) => void;

/**
 * One item accepted by Menu().
 */
export interface MenuCompositionItem {
    value?: string;
    label: MenuCompositionContent;
    disabled?: boolean;
    defaultCurrent?: boolean;
    itemOptions?: BaseCompositionOptions;
    announceOnHover?: boolean;
    hoverAnnouncement?: string | null;
    onSelect?: MenuCompositionItemOnSelect | null;
}

/**
 * Partial item update accepted by menu.update({ items }).
 */
export interface MenuCompositionItemUpdate {
    label?: MenuCompositionContent;
    disabled?: boolean;
    itemOptions?: BaseCompositionOptions;
    announceOnHover?: boolean;
    hoverAnnouncement?: string | null;
    onSelect?: MenuCompositionItemOnSelect | null;
}

/**
 * Called when any composed menu item is activated.
 */
export type MenuCompositionOnSelect = (
    detail: MenuCompositionSelectDetail,
    menu: ComposedMenu
) => void;

/**
 * Called when the composed menu asks its owner to close.
 */
export type MenuCompositionOnClose = (menu: ComposedMenu) => void;

/**
 * Options for Menu().
 */
export interface MenuCompositionOptions
    extends Omit<
            MenuInstanceOptions,
            "getItems" | "defaultItem" | "getItemText" | "isItemDisabled" | "onSelect" | "onClose"
        >,
        BaseCompositionOptions {
    items: MenuCompositionItem[];
    value?: string;
    defaultValue?: string;
    orientation?: MenuOrientation;
    variant?: MenuVariant;
    size?: MenuSize;
    announceOnHover?: boolean;
    onSelect?: MenuCompositionOnSelect | null;
    onClose?: MenuCompositionOnClose | null;
}

/**
 * Options accepted by ComposedMenu.update().
 *
 * Item identity, orientation, looping, typeahead, closeOnSelect, and defaultValue
 * are creation-time options because they affect keyboard wiring or initial state.
 */
export interface MenuCompositionUpdateOptions
    extends Partial<
        Omit<
            MenuCompositionOptions,
            | "items"
            | "orientation"
            | "loop"
            | "defaultValue"
            | "typeahead"
            | "typeaheadTimeout"
            | "closeOnSelect"
        >
    > {
    items?: MenuCompositionItemUpdate[];
}

/**
 * One menu item created by the composition API.
 */
export interface ComposedMenuItem {
    readonly value: string;
    readonly item: HTMLElement;
    setLabelContent(content: MenuCompositionContent): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    getText(): string;
}

/**
 * Menu created by the composition API.
 */
export interface ComposedMenu
    extends Omit<MenuInstance, "element" | "menu" | "getCurrentItem" | "setCurrentItem" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly menu: HTMLElement;
    readonly items: ComposedMenuItem[];
    getItem(value: string): ComposedMenuItem | null;
    getCurrentItem(): ComposedMenuItem | null;
    getCurrentValue(): string | null;
    getCurrentElement(): HTMLElement | null;
    setCurrentElement(item: HTMLElement | null, options?: { focus?: boolean }): boolean;
    setCurrentValue(value: string, options?: { focus?: boolean }): boolean;
    update(options: MenuCompositionUpdateOptions): void;
    destroy(): void;
}

interface MenuItemNode {
    value: string;
    item: HTMLElement;
    labelContent: ReturnType<typeof createContentSlot>;
    hoverAnnouncement: ReturnType<typeof createHoverAnnouncement>;
    announceOnHover: boolean | undefined;
    disabled: boolean;
    onSelect: MenuCompositionItemOnSelect | null;
}

function getElementText(element: HTMLElement, fallback: string): string {
    return element.textContent?.trim() || fallback;
}

function getMenuItemText(item: HTMLElement, itemNodes: MenuItemNode[]): string {
    const node = itemNodes.find((candidate) => candidate.item === item);

    return getElementText(item, node?.value ?? "");
}

function getUniqueValue(
    item: MenuCompositionItem,
    index: number,
    usedValues: Set<string>
): string {
    const baseValue = item.value ?? item.itemOptions?.id ?? `item-${index + 1}`;
    let value = baseValue;
    let suffix = 2;

    while (usedValues.has(value)) {
        value = `${baseValue}-${suffix++}`;
    }

    usedValues.add(value);
    return value;
}

function syncItemDisabled(node: MenuItemNode, disabled: boolean): void {
    node.disabled = disabled;

    if (disabled) {
        node.item.setAttribute("aria-disabled", "true");
        node.item.setAttribute("data-af-disabled", "true");
    } else {
        node.item.removeAttribute("aria-disabled");
        node.item.removeAttribute("data-af-disabled");
    }
}

function applyItemOptions(item: HTMLElement, options: BaseCompositionOptions | undefined): void {
    applyCompositionElementOptions(item, options);
    item.setAttribute("data-af-menu-item", "");
}

function createItemNodes(
    items: MenuCompositionItem[],
    rootAnnounceOnHover: boolean
): MenuItemNode[] {
    const usedValues = new Set<string>();

    return items.map((item, index): MenuItemNode => {
        const value = getUniqueValue(item, index, usedValues);
        const itemElement = createElement("div", getCompositionElementOptions(
            item.itemOptions,
            { "data-af-menu-item": "" }
        ));

        if (!itemElement.id) itemElement.id = createId("af-menu-item");

        const node: MenuItemNode = {
            value,
            item: itemElement,
            labelContent: createContentSlot(itemElement, toCompositionChildren(item.label)),
            hoverAnnouncement: createHoverAnnouncement(itemElement, {
                message: item.hoverAnnouncement ?? undefined,
                enabled: item.announceOnHover ?? rootAnnounceOnHover
            }),
            announceOnHover: item.announceOnHover,
            disabled: false,
            onSelect: item.onSelect ?? null
        };

        syncItemDisabled(node, item.disabled ?? false);

        return node;
    });
}

function getDefaultItem(
    options: MenuCompositionOptions,
    itemNodes: MenuItemNode[]
): HTMLElement | null {
    const currentValue = options.value ?? options.defaultValue;

    if (currentValue !== undefined) {
        return itemNodes.find((node) => node.value === currentValue && !node.disabled)?.item ?? null;
    }

    const currentIndex = options.items.findIndex((item) => item.defaultCurrent === true);
    const currentNode = currentIndex >= 0 ? itemNodes[currentIndex] : null;

    return currentNode && !currentNode.disabled ? currentNode.item : null;
}

function getMenuOptions(
    options: MenuCompositionOptions,
    itemNodes: MenuItemNode[],
    onSelect: (item: HTMLElement, event: Event) => void,
    onClose: () => void
): MenuInstanceOptions {
    const menuOptions: MenuInstanceOptions = {
        getItems: () => itemNodes.map((node) => node.item),
        isItemDisabled: (item) => (
            itemNodes.find((node) => node.item === item)?.disabled
            ?? item.getAttribute("aria-disabled") === "true"
        ),
        getItemText: (item) => getMenuItemText(item, itemNodes),
        onSelect,
        onClose
    };

    const defaultItem = getDefaultItem(options, itemNodes);

    if (defaultItem) menuOptions.defaultItem = defaultItem;
    if (options.orientation !== undefined) menuOptions.orientation = options.orientation;
    if (options.loop !== undefined) menuOptions.loop = options.loop;
    if (options.typeahead !== undefined) menuOptions.typeahead = options.typeahead;
    if (options.typeaheadTimeout !== undefined) menuOptions.typeaheadTimeout = options.typeaheadTimeout;
    if (options.closeOnSelect !== undefined) menuOptions.closeOnSelect = options.closeOnSelect;
    if (options.variant !== undefined) menuOptions.variant = options.variant;
    if (options.size !== undefined) menuOptions.size = options.size;

    return menuOptions;
}

function getMenuUpdateOptions(options: MenuCompositionUpdateOptions): MenuInstanceUpdateOptions {
    const menuOptions: MenuInstanceUpdateOptions = {};

    if (options.variant !== undefined) menuOptions.variant = options.variant;
    if (options.size !== undefined) menuOptions.size = options.size;

    return menuOptions;
}

/**
 * Creates an accessible command menu with roving focus, typeahead, and item activation.
 */
export function Menu(options: MenuCompositionOptions): ComposedMenu {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "menu"
    }));

    let announceOnHover = options.announceOnHover ?? true;

    const itemNodes = createItemNodes(options.items, announceOnHover);

    for (const node of itemNodes) {
        element.append(node.item);
    }

    let composed!: ComposedMenu;
    let composedItems: ComposedMenuItem[] = [];
    let onSelect = options.onSelect ?? null;
    let onClose = options.onClose ?? null;

    const handleSelect = (item: HTMLElement, event: Event): void => {
        const menuItem = composedItems.find((candidate) => candidate.item === item);
        const node = itemNodes.find((candidate) => candidate.item === item);

        if (!menuItem || !node) return;

        const detail: MenuCompositionSelectDetail = {
            value: menuItem.value,
            item,
            menuItem,
            event,
            text: menuItem.getText()
        };

        node.onSelect?.(detail, composed);
        onSelect?.(detail, composed);
    };

    const menu = createMenuComponent(
        element,
        getMenuOptions(
            options,
            itemNodes,
            handleSelect,
            () => onClose?.(composed)
        )
    );

    function getItem(value: string): ComposedMenuItem | null {
        return composedItems.find((item) => item.value === value) ?? null;
    }

    function getCurrentItem(): ComposedMenuItem | null {
        const currentItem = menu.getCurrentItem();

        return composedItems.find((item) => item.item === currentItem) ?? null;
    }

    function setCurrentValue(value: string, setOptions: { focus?: boolean } = {}): boolean {
        return menu.setCurrentItem(getItem(value)?.item ?? null, setOptions);
    }

    composedItems = itemNodes.map((node): ComposedMenuItem => ({
        value: node.value,
        item: node.item,
        getText(): string {
            return getElementText(node.item, node.value);
        },

        setLabelContent(content): void {
            node.labelContent.set(toCompositionChildren(content));
        },

        setDisabled(disabled): void {
            syncItemDisabled(node, disabled);
            menu.refresh();
        },

        isDisabled(): boolean {
            return node.disabled;
        }
    }));

    composed = {
        element,
        menu: element,
        items: composedItems,

        refresh: menu.refresh,
        getItem,
        getCurrentItem,

        getCurrentValue(): string | null {
            return getCurrentItem()?.value ?? null;
        },

        getCurrentElement(): HTMLElement | null {
            return menu.getCurrentItem();
        },

        setCurrentElement: menu.setCurrentItem,
        setCurrentValue,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("onSelect" in nextOptions) {
                onSelect = nextOptions.onSelect ?? null;
            }

            if ("onClose" in nextOptions) {
                onClose = nextOptions.onClose ?? null;
            }

            if (nextOptions.announceOnHover !== undefined) {
                announceOnHover = nextOptions.announceOnHover;

                for (const node of itemNodes) {
                    node.hoverAnnouncement.setEnabled(node.announceOnHover ?? announceOnHover);
                }
            }

            if (nextOptions.items !== undefined) {
                nextOptions.items.forEach((nextItem, index) => {
                    const node = itemNodes[index];
                    const item = composedItems[index];

                    if (!node || !item) return;

                    if (nextItem.itemOptions !== undefined) {
                        applyItemOptions(node.item, nextItem.itemOptions);
                    }

                    if (nextItem.label !== undefined) {
                        item.setLabelContent(nextItem.label);
                    }

                    if (nextItem.disabled !== undefined) {
                        item.setDisabled(nextItem.disabled);
                    }

                    if ("hoverAnnouncement" in nextItem) {
                        node.hoverAnnouncement.setMessage(nextItem.hoverAnnouncement ?? undefined);
                    }

                    if (nextItem.announceOnHover !== undefined) {
                        node.announceOnHover = nextItem.announceOnHover;
                        node.hoverAnnouncement.setEnabled(node.announceOnHover ?? announceOnHover);
                    }

                    if ("onSelect" in nextItem) {
                        node.onSelect = nextItem.onSelect ?? null;
                    }
                });
            }

            menu.update(getMenuUpdateOptions(nextOptions));

            if (nextOptions.value !== undefined) {
                setCurrentValue(nextOptions.value);
            }
        },

        destroy(): void {
            for (const node of itemNodes) {
                node.labelContent.dispose();
                node.hoverAnnouncement.destroy();
            }

            menu.destroy();
        },

        isDestroyed(): boolean {
            return menu.isDestroyed();
        }
    };

    return composed;
}
