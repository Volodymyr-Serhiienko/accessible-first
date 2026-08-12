import { createFormField, type FormFieldInvalidState } from "../../../core/src/form-field";
import { createId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getElementText,
    getCompositionElementOptions,
    hasVisibleContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent
} from "../composition";
import { createRadioGroup as createRadioGroupComponent } from "./createRadioGroup";
import type {
    RadioGroup as RadioGroupInstance,
    RadioGroupChangeDetail,
    RadioGroupOptions,
    RadioGroupOrientation,
    RadioGroupSize,
    RadioGroupValue,
    RadioGroupVariant
} from "./types";

/**
 * Content accepted by radio group labels, descriptions, and error slots.
 */
export type RadioGroupCompositionContent = CompositionContent;

/**
 * Value accepted by composed radio group APIs.
 */
export type RadioGroupCompositionValue = RadioGroupValue;

/**
 * One option accepted by RadioGroup().
 */
export interface RadioGroupCompositionItem {
    value?: string;
    label: RadioGroupCompositionContent;
    description?: RadioGroupCompositionContent | null;
    disabled?: boolean;
    defaultSelected?: boolean;
    itemOptions?: BaseCompositionOptions;
    inputOptions?: BaseCompositionOptions;
    labelOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
}

/**
 * Partial item update accepted by radioGroup.update({ items }).
 */
export interface RadioGroupCompositionItemUpdate {
    label?: RadioGroupCompositionContent;
    description?: RadioGroupCompositionContent | null;
    disabled?: boolean;
    itemOptions?: BaseCompositionOptions;
    inputOptions?: BaseCompositionOptions;
    labelOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
}

/**
 * Details passed when composed radio group value changes.
 */
export interface RadioGroupCompositionChangeDetail extends RadioGroupChangeDetail {
    selectedItem: ComposedRadioGroupItem | null;
    selectedText: string;
}

/**
 * Called when composed radio group value changes through user interaction.
 */
export type RadioGroupCompositionOnValueChange = (
    detail: RadioGroupCompositionChangeDetail,
    radioGroup: ComposedRadioGroup
) => void;

/**
 * Options for RadioGroup().
 */
export interface RadioGroupCompositionOptions
    extends Omit<RadioGroupOptions, "radios" | "isRadioDisabled" | "onValueChange">,
        BaseCompositionOptions {
    label: RadioGroupCompositionContent;
    description?: RadioGroupCompositionContent | null;
    errorMessage?: RadioGroupCompositionContent | null;
    items: RadioGroupCompositionItem[];
    labelOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    errorOptions?: BaseCompositionOptions;
    orientation?: RadioGroupOrientation;
    variant?: RadioGroupVariant;
    size?: RadioGroupSize;
    onValueChange?: RadioGroupCompositionOnValueChange | null;
}

/**
 * Options accepted by ComposedRadioGroup.update().
 *
 * defaultValue is creation-time only. Item identity is matched by index.
 */
export interface RadioGroupCompositionUpdateOptions
    extends Partial<Omit<RadioGroupCompositionOptions, "items" | "defaultValue">> {
    items?: RadioGroupCompositionItemUpdate[];
}

/**
 * One radio option created by the composition API.
 */
export interface ComposedRadioGroupItem {
    readonly value: string;
    readonly element: HTMLElement;
    readonly input: HTMLInputElement;
    readonly label: HTMLLabelElement;
    readonly description: HTMLElement;
    getText(): string;
    setLabelContent(content: RadioGroupCompositionContent): void;
    setDescription(content: RadioGroupCompositionContent | null): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
}

/**
 * Radio group created by the composition API.
 */
export interface ComposedRadioGroup
    extends Omit<RadioGroupInstance, "element" | "group" | "radios" | "update" | "destroy"> {
    readonly element: HTMLFieldSetElement;
    readonly group: HTMLFieldSetElement;
    readonly legend: HTMLLegendElement;
    readonly description: HTMLElement;
    readonly errorMessage: HTMLElement;
    readonly items: ComposedRadioGroupItem[];
    getItem(value: string): ComposedRadioGroupItem | null;
    getSelectedItem(): ComposedRadioGroupItem | null;
    setLabelContent(content: RadioGroupCompositionContent): void;
    setDescription(content: RadioGroupCompositionContent | null): void;
    setErrorMessage(content: RadioGroupCompositionContent | null): void;
    update(options: RadioGroupCompositionUpdateOptions): void;
    destroy(): void;
}

interface RadioGroupItemNode {
    value: string;
    element: HTMLElement;
    input: HTMLInputElement;
    label: HTMLLabelElement;
    description: HTMLElement;
    labelSlot: ReturnType<typeof createContentSlot>;
    descriptionSlot: ReturnType<typeof createContentSlot>;
    formField: ReturnType<typeof createFormField>;
    disabled: boolean;
}

interface RadioGroupOptionsSource {
    value?: RadioGroupValue;
    defaultValue?: RadioGroupValue;
    disabled?: boolean;
    required?: boolean;
    invalid?: FormFieldInvalidState;
    name?: string;
    orientation?: RadioGroupOrientation;
    variant?: RadioGroupVariant;
    size?: RadioGroupSize;
}

function getUniqueValue(
    item: RadioGroupCompositionItem,
    index: number,
    usedValues: Set<string>
): string {
    const baseValue = item.value ?? item.inputOptions?.id ?? `option-${index + 1}`;
    let value = baseValue;
    let suffix = 2;

    while (usedValues.has(value)) {
        value = `${baseValue}-${suffix++}`;
    }

    usedValues.add(value);
    return value;
}

function createItemNodes(
    items: RadioGroupCompositionItem[],
    name: string
): RadioGroupItemNode[] {
    const usedValues = new Set<string>();

    return items.map((item, index): RadioGroupItemNode => {
        const value = getUniqueValue(item, index, usedValues);
        const element = createElement("div", getCompositionElementOptions(item.itemOptions, {
            "data-af-radio-group-item": ""
        }));
        const input = createElement("input", getCompositionElementOptions(item.inputOptions, {
            "data-af-radio-input": "",
            type: "radio"
        }));

        input.value = value;
        input.name = name;

        if (!input.id) {
            input.id = createId("af-radio");
        }

        const label = createElement("label", getCompositionElementOptions(item.labelOptions, {
            "data-af-radio-label": "",
            for: input.id
        }));
        const indicator = createElement("span", {
            attributes: {
                "data-af-radio-indicator": "",
                "aria-hidden": "true"
            }
        });
        const labelText = createElement("span", {
            attributes: {
                "data-af-radio-label-text": ""
            }
        });
        const description = createElement("div", getCompositionElementOptions(item.descriptionOptions, {
            "data-af-radio-description": ""
        }));

        const node: RadioGroupItemNode = {
            value,
            element,
            input,
            label,
            description,
            labelSlot: createContentSlot(labelText, toCompositionChildren(item.label)),
            descriptionSlot: createContentSlot(description, toCompositionChildren(item.description)),
            formField: createFormField(input),
            disabled: item.disabled ?? input.disabled
        };

        label.append(indicator, labelText);
        element.append(input, label, description);

        return node;
    });
}

function getDefaultValue(
    options: RadioGroupCompositionOptions,
    itemNodes: RadioGroupItemNode[]
): RadioGroupValue | undefined {
    if ("value" in options) return options.value ?? null;
    if ("defaultValue" in options) return options.defaultValue ?? null;

    const defaultItem = options.items
        .map((item, index) => item.defaultSelected ? itemNodes[index] : null)
        .find((node): node is RadioGroupItemNode => Boolean(node && !node.disabled));

    return defaultItem?.value;
}

function getSelectedItemByInput(
    input: HTMLInputElement | null,
    items: ComposedRadioGroupItem[]
): ComposedRadioGroupItem | null {
    return items.find((item) => item.input === input) ?? null;
}

function getRadioGroupOptions(
    options: RadioGroupOptionsSource,
    itemNodes: RadioGroupItemNode[],
    onValueChange: NonNullable<RadioGroupOptions["onValueChange"]>
): RadioGroupOptions {
    const radioGroupOptions: RadioGroupOptions = {
        radios: itemNodes.map((node) => node.input),
        isRadioDisabled: (radio) => itemNodes.find((node) => node.input === radio)?.disabled ?? radio.disabled,
        onValueChange
    };

    if ("value" in options) radioGroupOptions.value = options.value ?? null;
    if (options.defaultValue !== undefined) radioGroupOptions.defaultValue = options.defaultValue;
    if (options.disabled !== undefined) radioGroupOptions.disabled = options.disabled;
    if (options.required !== undefined) radioGroupOptions.required = options.required;
    if (options.invalid !== undefined) radioGroupOptions.invalid = options.invalid;
    if (options.name !== undefined) radioGroupOptions.name = options.name;
    if (options.orientation !== undefined) radioGroupOptions.orientation = options.orientation;
    if (options.variant !== undefined) radioGroupOptions.variant = options.variant;
    if (options.size !== undefined) radioGroupOptions.size = options.size;

    return radioGroupOptions;
}

/**
 * Creates an accessible native radio group with legend, description, error,
 * and per-option label/description slots.
 */
export function RadioGroup(options: RadioGroupCompositionOptions): ComposedRadioGroup {
    const name = options.name ?? createId("af-radio-group");
    const element = createElement("fieldset", getCompositionElementOptions(options, {
        "data-af-composition": "radio-group"
    }));
    const legend = createElement("legend", getCompositionElementOptions(options.labelOptions, {
        "data-af-radio-group-legend": ""
    }));
    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-radio-group-description": ""
    }));
    const errorMessage = createElement("div", getCompositionElementOptions(options.errorOptions, {
        "data-af-radio-group-error": ""
    }));
    const itemsElement = createElement("div", {
        attributes: {
            "data-af-radio-group-items": ""
        }
    });

    const legendSlot = createContentSlot(legend, toCompositionChildren(options.label));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(options.description));
    const errorSlot = createContentSlot(errorMessage, toCompositionChildren(options.errorMessage));
    const itemNodes = createItemNodes(options.items, name);
    const defaultValue = getDefaultValue(options, itemNodes);

    for (const node of itemNodes) {
        itemsElement.append(node.element);
    }

    element.append(legend, description, errorMessage, itemsElement);

    let composed!: ComposedRadioGroup;
    let composedItems: ComposedRadioGroupItem[] = [];
    let onValueChange = options.onValueChange ?? null;
    let invalid: FormFieldInvalidState = options.invalid ?? false;

    const groupFormField = createFormField(element);

    function syncItemReferences(node: RadioGroupItemNode): void {
        if (!node.input.id) {
            node.input.id = createId("af-radio");
        }

        node.label.htmlFor = node.input.id;
        node.description.hidden = !hasVisibleContent(node.description);
        node.element.toggleAttribute("data-af-disabled", node.disabled);

        node.formField.setLabel(node.label);
        node.formField.setDescription(node.description.hidden ? null : node.description);
    }

    function syncGroupReferences(): void {
        description.hidden = !hasVisibleContent(description);
        errorMessage.hidden = !hasVisibleContent(errorMessage);

        groupFormField.setLabel(legend);
        groupFormField.setDescription(description.hidden ? null : description);
        groupFormField.setErrorMessage(!invalid || errorMessage.hidden ? null : errorMessage);

        for (const node of itemNodes) {
            syncItemReferences(node);
        }
    }

    function getItem(value: string): ComposedRadioGroupItem | null {
        return composedItems.find((item) => item.value === value) ?? null;
    }

    function getSelectedItem(): ComposedRadioGroupItem | null {
        return getSelectedItemByInput(radioGroup.getSelectedInput(), composedItems);
    }

    function setLabelContent(content: RadioGroupCompositionContent): void {
        legendSlot.set(toCompositionChildren(content));
        syncGroupReferences();
    }

    function setDescription(content: RadioGroupCompositionContent | null): void {
        descriptionSlot.set(toCompositionChildren(content));
        syncGroupReferences();
    }

    function setErrorMessage(content: RadioGroupCompositionContent | null): void {
        errorSlot.set(toCompositionChildren(content));
        syncGroupReferences();
    }

    syncGroupReferences();

    const initialRadioGroupOptions = getRadioGroupOptions(
        options,
        itemNodes,
        (detail) => {
            const selectedItem = getSelectedItemByInput(detail.input, composedItems);

            onValueChange?.(
                {
                    ...detail,
                    selectedItem,
                    selectedText: selectedItem?.getText() ?? ""
                },
                composed
            );
        }
    );

    if (
        defaultValue !== undefined
        && !("value" in options)
        && !("defaultValue" in options)
    ) {
        initialRadioGroupOptions.defaultValue = defaultValue;
    }

    const radioGroup = createRadioGroupComponent(element, initialRadioGroupOptions);

    composedItems = itemNodes.map((node): ComposedRadioGroupItem => ({
        value: node.value,
        element: node.element,
        input: node.input,
        label: node.label,
        description: node.description,

        getText(): string {
            return getElementText(node.label, node.value);
        },

        setLabelContent(content): void {
            node.labelSlot.set(toCompositionChildren(content));
            syncItemReferences(node);
        },

        setDescription(content): void {
            node.descriptionSlot.set(toCompositionChildren(content));
            syncItemReferences(node);
        },

        setDisabled(disabled): void {
            node.disabled = disabled;
            syncItemReferences(node);
            radioGroup.refresh();
        },

        isDisabled(): boolean {
            return node.disabled;
        }
    }));

    composed = {
        element,
        group: element,
        legend,
        description,
        errorMessage,
        items: composedItems,

        getValue: radioGroup.getValue,
        getSelectedInput: radioGroup.getSelectedInput,
        setValue: radioGroup.setValue,
        setDisabled: radioGroup.setDisabled,
        isDisabled: radioGroup.isDisabled,
        setRequired: radioGroup.setRequired,
        isRequired: radioGroup.isRequired,
        refresh: radioGroup.refresh,
        getItem,
        getSelectedItem,
        setLabelContent,
        setDescription,
        setErrorMessage,

        setInvalid(nextInvalid): void {
            invalid = nextInvalid;
            radioGroup.setInvalid(nextInvalid);
            syncGroupReferences();
        },

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.labelOptions !== undefined) {
                applyCompositionElementOptions(legend, nextOptions.labelOptions);
                legend.setAttribute("data-af-radio-group-legend", "");
            }

            if (nextOptions.descriptionOptions !== undefined) {
                applyCompositionElementOptions(description, nextOptions.descriptionOptions);
                description.setAttribute("data-af-radio-group-description", "");
            }

            if (nextOptions.errorOptions !== undefined) {
                applyCompositionElementOptions(errorMessage, nextOptions.errorOptions);
                errorMessage.setAttribute("data-af-radio-group-error", "");
            }

            if (nextOptions.label !== undefined) {
                setLabelContent(nextOptions.label);
            }

            if ("description" in nextOptions) {
                setDescription(nextOptions.description ?? null);
            }

            if ("errorMessage" in nextOptions) {
                setErrorMessage(nextOptions.errorMessage ?? null);
            }

            if ("onValueChange" in nextOptions) {
                onValueChange = nextOptions.onValueChange ?? null;
            }

            if (nextOptions.invalid !== undefined) {
                invalid = nextOptions.invalid;
            }

            if (nextOptions.items !== undefined) {
                nextOptions.items.forEach((nextItem, index) => {
                    const node = itemNodes[index];
                    const item = composedItems[index];

                    if (!node || !item) return;

                    if (nextItem.itemOptions !== undefined) {
                        applyCompositionElementOptions(node.element, nextItem.itemOptions);
                        node.element.setAttribute("data-af-radio-group-item", "");
                    }

                    if (nextItem.inputOptions !== undefined) {
                        applyCompositionElementOptions(node.input, nextItem.inputOptions);
                        node.input.setAttribute("data-af-radio-input", "");
                        node.input.type = "radio";
                        node.input.value = node.value;
                    }

                    if (nextItem.labelOptions !== undefined) {
                        applyCompositionElementOptions(node.label, nextItem.labelOptions);
                        node.label.setAttribute("data-af-radio-label", "");
                    }

                    if (nextItem.descriptionOptions !== undefined) {
                        applyCompositionElementOptions(node.description, nextItem.descriptionOptions);
                        node.description.setAttribute("data-af-radio-description", "");
                    }

                    if (nextItem.label !== undefined) {
                        item.setLabelContent(nextItem.label);
                    }

                    if ("description" in nextItem) {
                        item.setDescription(nextItem.description ?? null);
                    }

                    if (nextItem.disabled !== undefined) {
                        item.setDisabled(nextItem.disabled);
                    }

                    syncItemReferences(node);
                });
            }

            radioGroup.update(getRadioGroupOptions(nextOptions, itemNodes, (detail) => {
                const selectedItem = getSelectedItemByInput(detail.input, composedItems);

                onValueChange?.(
                    {
                        ...detail,
                        selectedItem,
                        selectedText: selectedItem?.getText() ?? ""
                    },
                    composed
                );
            }));

            syncGroupReferences();
        },

        destroy(): void {
            legendSlot.dispose();
            descriptionSlot.dispose();
            errorSlot.dispose();

            for (const node of itemNodes) {
                node.labelSlot.dispose();
                node.descriptionSlot.dispose();
                node.formField.destroy();
            }

            groupFormField.destroy();
            radioGroup.destroy();
        },

        isDestroyed(): boolean {
            return radioGroup.isDestroyed();
        }
    };

    return composed;
}
