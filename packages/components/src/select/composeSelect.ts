import { createId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createElement,
    getElementText,
    getCompositionElementOptions,
    type BaseCompositionOptions
} from "../composition";
import { createSelect as createSelectComponent } from "./createSelect";
import type {
    Select as SelectInstance,
    SelectChangeDetail,
    SelectOptions as SelectInstanceOptions,
    SelectSize,
    SelectValue,
    SelectVariant
} from "./types";

/**
 * Value accepted by composed select APIs.
 */
export type SelectCompositionValue = SelectValue;

/**
 * One native option accepted by Select().
 */
export interface SelectCompositionItem {
    value?: string;
    label: string;
    disabled?: boolean;
    defaultSelected?: boolean;
    optionOptions?: BaseCompositionOptions;
}

/**
 * Partial option update accepted by select.update({ items }).
 */
export interface SelectCompositionItemUpdate {
    label?: string;
    disabled?: boolean;
    optionOptions?: BaseCompositionOptions;
}

/**
 * Details passed when composed select value changes.
 */
export interface SelectCompositionChangeDetail extends SelectChangeDetail {
    selectedItems: ComposedSelectItem[];
}

/**
 * Called when composed select value changes.
 */
export type SelectCompositionOnValueChange = (
    detail: SelectCompositionChangeDetail,
    select: ComposedSelect
) => void;

/**
 * Options for Select().
 */
export interface SelectCompositionOptions
    extends Omit<SelectInstanceOptions, "value" | "onValueChange">,
        BaseCompositionOptions {
    label?: string | null;
    labelOptions?: BaseCompositionOptions;
    selectOptions?: BaseCompositionOptions;
    placeholder?: string | null;
    items: SelectCompositionItem[];
    value?: SelectCompositionValue;
    defaultValue?: SelectCompositionValue;
    variant?: SelectVariant;
    size?: SelectSize;
    onValueChange?: SelectCompositionOnValueChange | null;
}

/**
 * Options accepted by ComposedSelect.update().
 *
 * Option identity, placeholder, and defaultValue are creation-time options.
 */
export interface SelectCompositionUpdateOptions
    extends Partial<Omit<SelectCompositionOptions, "items" | "placeholder" | "defaultValue">> {
    items?: SelectCompositionItemUpdate[];
}

/**
 * One option created by the composition API.
 */
export interface ComposedSelectItem {
    readonly value: string;
    readonly option: HTMLOptionElement;
    getText(): string;
    setLabel(label: string): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
}

/**
 * Select created by the composition API.
 */
export interface ComposedSelect
    extends Omit<SelectInstance, "element" | "select" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly select: HTMLSelectElement;
    readonly items: ComposedSelectItem[];
    getLabelElement(): HTMLLabelElement | null;
    setLabel(label: string | null): void;
    getItem(value: string): ComposedSelectItem | null;
    getSelectedItems(): ComposedSelectItem[];
    update(options: SelectCompositionUpdateOptions): void;
    destroy(): void;
}

interface SelectItemNode {
    value: string;
    option: HTMLOptionElement;
    disabled: boolean;
}

function getUniqueValue(
    item: SelectCompositionItem,
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

function syncItemDisabled(node: SelectItemNode, disabled: boolean): void {
    node.disabled = disabled;
    node.option.disabled = disabled;

    if (disabled) {
        node.option.setAttribute("data-af-disabled", "true");
    } else {
        node.option.removeAttribute("data-af-disabled");
    }
}

function applyOptionOptions(option: HTMLOptionElement, options: BaseCompositionOptions | undefined): void {
    applyCompositionElementOptions(option, options);
    option.setAttribute("data-af-select-option", "");
}

function createItemNodes(items: SelectCompositionItem[]): SelectItemNode[] {
    const usedValues = new Set<string>();

    return items.map((item, index): SelectItemNode => {
        const value = getUniqueValue(item, index, usedValues);
        const option = createElement("option", getCompositionElementOptions(
            item.optionOptions,
            { "data-af-select-option": "" }
        ));

        option.value = value;
        option.textContent = item.label;
        option.defaultSelected = item.defaultSelected ?? false;

        const node: SelectItemNode = {
            value,
            option,
            disabled: false
        };

        syncItemDisabled(node, item.disabled ?? false);

        return node;
    });
}

function getInitialValue(
    options: SelectCompositionOptions,
    itemNodes: SelectItemNode[]
): SelectCompositionValue | undefined {
    if (options.value !== undefined) return options.value;
    if (options.defaultValue !== undefined) return options.defaultValue;

    const defaultValues = options.items
        .map((item, index) => item.defaultSelected ? itemNodes[index] : null)
        .filter((node): node is SelectItemNode => Boolean(node && !node.disabled))
        .map((node) => node.value);

    if (defaultValues.length === 0) return undefined;

    return options.multiple ? defaultValues : defaultValues[0];
}

function createPlaceholderOption(placeholder: string): HTMLOptionElement {
    const option = createElement("option", {
        text: placeholder,
        attributes: {
            "data-af-select-placeholder": ""
        }
    });

    option.value = "";
    option.disabled = true;
    option.hidden = true;
    option.selected = true;

    return option;
}

function getSelectOptions(
    options: SelectCompositionOptions | SelectCompositionUpdateOptions,
    value: SelectCompositionValue | undefined,
    onValueChange: (detail: SelectChangeDetail) => void
): SelectInstanceOptions {
    const selectOptions: SelectInstanceOptions = {
        onValueChange
    };

    if (options.disabled !== undefined) selectOptions.disabled = options.disabled;
    if (options.required !== undefined) selectOptions.required = options.required;
    if (options.multiple !== undefined) selectOptions.multiple = options.multiple;
    if ("name" in options) selectOptions.name = options.name ?? null;
    if (options.variant !== undefined) selectOptions.variant = options.variant;
    if (options.size !== undefined) selectOptions.size = options.size;
    if (value !== undefined) selectOptions.value = value;
    if ("visibleRows" in options) selectOptions.visibleRows = options.visibleRows ?? null;

    return selectOptions;
}

/**
 * Creates an accessible native select with an optional visible label.
 */
export function Select(options: SelectCompositionOptions): ComposedSelect {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "select"
    }));

    const select = createElement("select", getCompositionElementOptions(options.selectOptions, {
        "data-af-select-control": ""
    }));

    const itemNodes = createItemNodes(options.items);
    const initialValue = getInitialValue(options, itemNodes);
    const placeholder = options.placeholder?.trim();

    if (placeholder && !options.multiple && initialValue === undefined) {
        select.append(createPlaceholderOption(placeholder));
    }

    for (const node of itemNodes) {
        select.append(node.option);
    }

    element.append(select);

    let composed!: ComposedSelect;
    let composedItems: ComposedSelectItem[] = [];
    let labelElement: HTMLLabelElement | null = null;
    let onValueChange = options.onValueChange ?? null;

    function ensureSelectId(): string {
        if (!select.id) {
            select.id = createId("af-select");
        }

        return select.id;
    }

    function ensureLabelElement(): HTMLLabelElement {
        if (labelElement) {
            return labelElement;
        }

        labelElement = createElement("label", getCompositionElementOptions(options.labelOptions, {
            "data-af-select-label": "",
            for: ensureSelectId()
        }));

        element.insertBefore(labelElement, select);

        return labelElement;
    }

    function syncLabelFor(): void {
        if (labelElement) {
            labelElement.htmlFor = ensureSelectId();
        }
    }

    function setLabel(label: string | null): void {
        const text = label?.trim() ?? "";

        if (!text) {
            labelElement?.remove();
            labelElement = null;
            return;
        }

        const nextLabel = ensureLabelElement();

        nextLabel.textContent = text;
        nextLabel.setAttribute("data-af-select-label", "");
        syncLabelFor();
    }

    function getItem(value: string): ComposedSelectItem | null {
        return composedItems.find((item) => item.value === value) ?? null;
    }

    const handleValueChange = (detail: SelectChangeDetail): void => {
        const selectedOptions = new Set(detail.selectedOptions);
        const selectedItems = composedItems.filter((item) => selectedOptions.has(item.option));

        onValueChange?.(
            {
                ...detail,
                selectedItems
            },
            composed
        );
    };

    setLabel(options.label ?? null);

    const selectComponent = createSelectComponent(
        select,
        getSelectOptions(options, initialValue, handleValueChange)
    );

    composedItems = itemNodes.map((node): ComposedSelectItem => ({
        value: node.value,
        option: node.option,

        getText(): string {
            return getElementText(node.option, node.value);
        },

        setLabel(label): void {
            node.option.textContent = label;
        },

        setDisabled(disabled): void {
            syncItemDisabled(node, disabled);
        },

        isDisabled(): boolean {
            return node.disabled;
        }
    }));

    composed = {
        element,
        select,
        items: composedItems,

        getValue: selectComponent.getValue,
        getValues: selectComponent.getValues,
        setValue: selectComponent.setValue,
        setDisabled: selectComponent.setDisabled,
        isDisabled: selectComponent.isDisabled,
        setRequired: selectComponent.setRequired,
        isRequired: selectComponent.isRequired,
        setMultiple: selectComponent.setMultiple,
        isMultiple: selectComponent.isMultiple,

        getLabelElement(): HTMLLabelElement | null {
            return labelElement;
        },

        setLabel,
        getItem,

        getSelectedItems(): ComposedSelectItem[] {
            const selectedOptions = new Set(Array.from(select.selectedOptions));

            return composedItems.filter((item) => selectedOptions.has(item.option));
        },

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.selectOptions !== undefined) {
                applyCompositionElementOptions(select, nextOptions.selectOptions);
                select.setAttribute("data-af-select-control", "");
                syncLabelFor();
            }

            if ("label" in nextOptions) {
                setLabel(nextOptions.label ?? null);
            }

            if (nextOptions.labelOptions !== undefined && labelElement) {
                applyCompositionElementOptions(labelElement, nextOptions.labelOptions);
                labelElement.setAttribute("data-af-select-label", "");
                syncLabelFor();
            }

            if ("onValueChange" in nextOptions) {
                onValueChange = nextOptions.onValueChange ?? null;
            }

            if (nextOptions.items !== undefined) {
                nextOptions.items.forEach((nextItem, index) => {
                    const node = itemNodes[index];
                    const item = composedItems[index];

                    if (!node || !item) return;

                    if (nextItem.optionOptions !== undefined) {
                        applyOptionOptions(node.option, nextItem.optionOptions);
                        node.option.value = node.value;
                    }

                    if (nextItem.label !== undefined) {
                        item.setLabel(nextItem.label);
                    }

                    if (nextItem.disabled !== undefined) {
                        item.setDisabled(nextItem.disabled);
                    }
                });
            }

            selectComponent.update(getSelectOptions(
                nextOptions,
                nextOptions.value,
                handleValueChange
            ));
        },

        destroy(): void {
            labelElement?.remove();
            selectComponent.destroy();
        },

        isDestroyed(): boolean {
            return selectComponent.isDestroyed();
        }
    };

    return composed;
}
