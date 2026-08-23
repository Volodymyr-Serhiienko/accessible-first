import { createId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getElementText,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent
} from "../composition";
import { createHoverAnnouncement } from "../foundation";
import { createListbox as createListboxComponent } from "./createListbox";
import type {
    Listbox as ListboxInstance,
    ListboxOptions as ListboxInstanceOptions,
    ListboxOrientation,
    ListboxSelectionMode,
    ListboxSize,
    ListboxUpdateOptions as ListboxInstanceUpdateOptions,
    ListboxVariant
} from "./types";

/**
 * Content accepted by listbox option labels.
 */
export type ListboxCompositionContent = CompositionContent;

/**
 * Value accepted by composed listbox selection APIs.
 */
export type ListboxCompositionValue = string | string[];

/**
 * One option accepted by Listbox().
 */
export interface ListboxCompositionItem {
    value?: string;
    label: ListboxCompositionContent;
    disabled?: boolean;
    defaultSelected?: boolean;
    optionOptions?: BaseCompositionOptions;
    announceOnHover?: boolean;
    hoverAnnouncement?: string | null;
}

/**
 * Partial option update accepted by listbox.update({ items }).
 */
export interface ListboxCompositionItemUpdate {
    label?: ListboxCompositionContent;
    disabled?: boolean;
    optionOptions?: BaseCompositionOptions;
    announceOnHover?: boolean;
    hoverAnnouncement?: string | null;
}

/**
 * Details passed when composed listbox selection changes.
 */
export interface ListboxCompositionSelectionChangeDetail {
    selectedValues: string[];
    selectedOptions: HTMLElement[];
    selectedItems: ComposedListboxItem[];
    selectedTexts: string[];
    selectedText: string;
}

/**
 * Called when composed listbox selection changes.
 */
export type ListboxCompositionOnSelectionChange = (
    detail: ListboxCompositionSelectionChangeDetail,
    listbox: ComposedListbox
) => void;

/**
 * Options for Listbox().
 */
export interface ListboxCompositionOptions
    extends Omit<
            ListboxInstanceOptions,
            "getOptions" | "defaultSelectedOptions" | "selectedOptions" | "isOptionDisabled" | "getOptionText" | "onSelectionChange"
        >,
        BaseCompositionOptions {
    items: ListboxCompositionItem[];
    value?: ListboxCompositionValue;
    defaultValue?: ListboxCompositionValue;
    orientation?: ListboxOrientation;
    selectionMode?: ListboxSelectionMode;
    variant?: ListboxVariant;
    size?: ListboxSize;
    announceOnHover?: boolean;
    onSelectionChange?: ListboxCompositionOnSelectionChange | null;
}

/**
 * Options accepted by ComposedListbox.update().
 */
export interface ListboxCompositionUpdateOptions
    extends Partial<
        Omit<
            ListboxCompositionOptions,
            "items" | "loop" | "orientation" | "selectionMode" | "selectionFollowsFocus" | "typeahead" | "typeaheadTimeout" | "defaultValue"
        >
    > {
    items?: ListboxCompositionItemUpdate[];
}

/**
 * One option created by the composition API.
 */
export interface ComposedListboxItem {
    readonly value: string;
    readonly option: HTMLElement;
    setLabelContent(content: ListboxCompositionContent): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    getText(): string;
}

/**
 * Listbox created by the composition API.
 */
export interface ComposedListbox
    extends Omit<ListboxInstance, "element" | "listbox" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly listbox: HTMLElement;
    readonly items: ComposedListboxItem[];
    getItem(value: string): ComposedListboxItem | null;
    getCurrentItem(): ComposedListboxItem | null;
    getCurrentValue(): string | null;
    getSelectedItems(): ComposedListboxItem[];
    getSelectedValues(): string[];
    setCurrentValue(value: string, options?: { focus?: boolean }): boolean;
    setSelectedValues(value: ListboxCompositionValue): void;
    selectValue(value: string): boolean;
    deselectValue(value: string): boolean;
    toggleValue(value: string): boolean;
    update(options: ListboxCompositionUpdateOptions): void;
    destroy(): void;
}

interface ListboxItemNode {
    value: string;
    option: HTMLElement;
    labelContent: ReturnType<typeof createContentSlot>;
    hoverAnnouncement: ReturnType<typeof createHoverAnnouncement>;
    announceOnHover: boolean | undefined;
    disabled: boolean;
}

function getListboxOptionText(option: HTMLElement, itemNodes: ListboxItemNode[]): string {
    const node = itemNodes.find((candidate) => candidate.option === option);

    return getElementText(option, node?.value ?? "");
}

function toValueArray(value: ListboxCompositionValue): string[] {
    return Array.isArray(value) ? value : [value];
}

function getUniqueValue(
    item: ListboxCompositionItem,
    index: number,
    usedValues: Set<string>
): string {
    const baseValue = item.value ?? item.optionOptions?.id ?? `option-${index + 1}`;
    let value = baseValue;
    let suffix = 2;

    while (usedValues.has(value)) {
        value = `${baseValue}-${suffix++}`;
    }

    usedValues.add(value);
    return value;
}

function syncItemDisabled(node: ListboxItemNode, disabled: boolean): void {
    node.disabled = disabled;

    if (disabled) {
        node.option.setAttribute("aria-disabled", "true");
        node.option.setAttribute("data-af-disabled", "true");
    } else {
        node.option.removeAttribute("aria-disabled");
        node.option.removeAttribute("data-af-disabled");
    }
}

function applyOptionOptions(option: HTMLElement, options: BaseCompositionOptions | undefined): void {
    applyCompositionElementOptions(option, options);
    option.setAttribute("data-af-listbox-option", "");
}

function createItemNodes(
    items: ListboxCompositionItem[],
    rootAnnounceOnHover: boolean
): ListboxItemNode[] {
    const usedValues = new Set<string>();

    return items.map((item, index): ListboxItemNode => {
        const value = getUniqueValue(item, index, usedValues);
        const option = createElement("div", getCompositionElementOptions(
            item.optionOptions,
            { "data-af-listbox-option": "" }
        ));

        if (!option.id) option.id = createId("af-listbox-option");

        const node: ListboxItemNode = {
            value,
            option,
            labelContent: createContentSlot(option, toCompositionChildren(item.label)),
            hoverAnnouncement: createHoverAnnouncement(option, {
                message: item.hoverAnnouncement ?? undefined,
                enabled: item.announceOnHover ?? rootAnnounceOnHover
            }),
            announceOnHover: item.announceOnHover,
            disabled: false
        };

        syncItemDisabled(node, item.disabled ?? false);

        return node;
    });
}

function getOptionElementsByValue(
    value: ListboxCompositionValue,
    itemNodes: ListboxItemNode[]
): HTMLElement[] {
    const values = new Set(toValueArray(value));

    return itemNodes
        .filter((node) => values.has(node.value) && !node.disabled)
        .map((node) => node.option);
}

function getDefaultSelectedOptions(
    options: ListboxCompositionOptions,
    itemNodes: ListboxItemNode[]
): HTMLElement[] {
    const selectedValue = options.value ?? options.defaultValue;

    if (selectedValue !== undefined) {
        return getOptionElementsByValue(selectedValue, itemNodes);
    }

    return options.items
        .map((item, index) => item.defaultSelected ? itemNodes[index] : null)
        .filter((node): node is ListboxItemNode => Boolean(node && !node.disabled))
        .map((node) => node.option);
}

function getListboxOptions(
    options: ListboxCompositionOptions,
    itemNodes: ListboxItemNode[],
    onSelectionChange: (selectedOptions: HTMLElement[]) => void
): ListboxInstanceOptions {
    const listboxOptions: ListboxInstanceOptions = {
        getOptions: () => itemNodes.map((node) => node.option),
        isOptionDisabled: (option) => (
            itemNodes.find((node) => node.option === option)?.disabled
            ?? option.getAttribute("aria-disabled") === "true"
        ),
        getOptionText: (option) => getListboxOptionText(option, itemNodes),
        onSelectionChange
    };

    const selectedOptions = getDefaultSelectedOptions(options, itemNodes);

    if (selectedOptions.length > 0) listboxOptions.defaultSelectedOptions = selectedOptions;
    if (options.label !== undefined) listboxOptions.label = options.label;
    if (options.labelledBy !== undefined) listboxOptions.labelledBy = options.labelledBy;
    if (options.orientation !== undefined) listboxOptions.orientation = options.orientation;
    if (options.loop !== undefined) listboxOptions.loop = options.loop;
    if (options.selectionMode !== undefined) listboxOptions.selectionMode = options.selectionMode;
    if (options.selectionFollowsFocus !== undefined) listboxOptions.selectionFollowsFocus = options.selectionFollowsFocus;
    if (options.typeahead !== undefined) listboxOptions.typeahead = options.typeahead;
    if (options.typeaheadTimeout !== undefined) listboxOptions.typeaheadTimeout = options.typeaheadTimeout;
    if (options.variant !== undefined) listboxOptions.variant = options.variant;
    if (options.size !== undefined) listboxOptions.size = options.size;

    return listboxOptions;
}

function getListboxUpdateOptions(
    options: ListboxCompositionUpdateOptions,
    itemNodes: ListboxItemNode[]
): ListboxInstanceUpdateOptions {
    const listboxOptions: ListboxInstanceUpdateOptions = {};

    if ("label" in options) listboxOptions.label = options.label ?? null;
    if ("labelledBy" in options) listboxOptions.labelledBy = options.labelledBy ?? null;
    if (options.variant !== undefined) listboxOptions.variant = options.variant;
    if (options.size !== undefined) listboxOptions.size = options.size;
    if (options.value !== undefined) {
        listboxOptions.selectedOptions = getOptionElementsByValue(options.value, itemNodes);
    }

    return listboxOptions;
}

/**
 * Creates an accessible listbox with selectable options.
 */
export function Listbox(options: ListboxCompositionOptions): ComposedListbox {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "listbox"
    }));

    let announceOnHover = options.announceOnHover ?? true;

    const itemNodes = createItemNodes(options.items, announceOnHover);

    for (const node of itemNodes) {
        element.append(node.option);
    }

    let composed!: ComposedListbox;
    let composedItems: ComposedListboxItem[] = [];
    let onSelectionChange = options.onSelectionChange ?? null;

    const handleSelectionChange = (selectedOptions: HTMLElement[]): void => {
        const selectedItems = composedItems.filter((item) => selectedOptions.includes(item.option));
        const selectedTexts = selectedItems.map((item) => item.getText());

        onSelectionChange?.(
            {
                selectedValues: selectedItems.map((item) => item.value),
                selectedOptions,
                selectedItems,
                selectedTexts,
                selectedText: selectedTexts.join(", ")
            },
            composed
        );
    };

    const listbox = createListboxComponent(
        element,
        getListboxOptions(options, itemNodes, handleSelectionChange)
    );

    function getItem(value: string): ComposedListboxItem | null {
        return composedItems.find((item) => item.value === value) ?? null;
    }

    function getCurrentItem(): ComposedListboxItem | null {
        const currentOption = listbox.getCurrentOption();

        return composedItems.find((item) => item.option === currentOption) ?? null;
    }

    function getSelectedItems(): ComposedListboxItem[] {
        const selectedOptions = listbox.getSelectedOptions();

        return composedItems.filter((item) => selectedOptions.includes(item.option));
    }

    function setCurrentValue(value: string, setOptions: { focus?: boolean } = {}): boolean {
        return listbox.setCurrentOption(getItem(value)?.option ?? null, setOptions);
    }

    function setSelectedValues(value: ListboxCompositionValue): void {
        listbox.setSelectedOptions(getOptionElementsByValue(value, itemNodes));
    }

    composedItems = itemNodes.map((node): ComposedListboxItem => ({
        value: node.value,
        option: node.option,
        getText(): string {
            return getElementText(node.option, node.value);
        },

        setLabelContent(content): void {
            node.labelContent.set(toCompositionChildren(content));
        },

        setDisabled(disabled): void {
            syncItemDisabled(node, disabled);
            listbox.refresh();
        },

        isDisabled(): boolean {
            return node.disabled;
        }
    }));

    composed = {
        element,
        listbox: element,
        items: composedItems,

        getCurrentOption: listbox.getCurrentOption,
        setCurrentOption: listbox.setCurrentOption,
        getSelectedOptions: listbox.getSelectedOptions,
        setSelectedOptions: listbox.setSelectedOptions,
        isSelected: listbox.isSelected,
        selectOption: listbox.selectOption,
        deselectOption: listbox.deselectOption,
        toggleOption: listbox.toggleOption,
        clearSelection: listbox.clearSelection,
        refresh: listbox.refresh,
        getItem,
        getCurrentItem,

        getCurrentValue(): string | null {
            return getCurrentItem()?.value ?? null;
        },

        getSelectedItems,

        getSelectedValues(): string[] {
            return getSelectedItems().map((item) => item.value);
        },

        setCurrentValue,
        setSelectedValues,

        selectValue(value): boolean {
            const item = getItem(value);

            return item ? listbox.selectOption(item.option) : false;
        },

        deselectValue(value): boolean {
            const item = getItem(value);

            return item ? listbox.deselectOption(item.option) : false;
        },

        toggleValue(value): boolean {
            const item = getItem(value);

            return item ? listbox.toggleOption(item.option) : false;
        },

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("onSelectionChange" in nextOptions) {
                onSelectionChange = nextOptions.onSelectionChange ?? null;
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

                    if (nextItem.optionOptions !== undefined) {
                        applyOptionOptions(node.option, nextItem.optionOptions);
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
                });
            }

            listbox.update(getListboxUpdateOptions(nextOptions, itemNodes));
        },

        destroy(): void {
            for (const node of itemNodes) {
                node.labelContent.dispose();
                node.hoverAnnouncement.destroy();
            }

            listbox.destroy();
        },

        isDestroyed(): boolean {
            return listbox.isDestroyed();
        }
    };

    return composed;
}
