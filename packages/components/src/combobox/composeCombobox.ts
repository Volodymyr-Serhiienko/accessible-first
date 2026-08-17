import { createId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getElementText,
    getCompositionElementOptions,
    setElementAttributeValue,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent,
    type ElementAttributes
} from "../composition";
import { createCombobox as createComboboxComponent } from "./createCombobox";
import { createAnnouncer, type Announcer } from "../../../core/src/live-region";
import type {
    Combobox as ComboboxInstance,
    ComboboxActiveOptionChangeDetail as ComboboxInstanceActiveOptionChangeDetail,
    ComboboxOptions as ComboboxInstanceOptions,
    ComboboxOpenChangeDetail as ComboboxInstanceOpenChangeDetail,
    ComboboxUpdateOptions as ComboboxInstanceUpdateOptions,
    ComboboxValueChangeDetail as ComboboxInstanceValueChangeDetail
} from "./types";

/**
 * Content accepted by combobox option labels.
 */
export type ComboboxCompositionContent = CompositionContent;

/**
 * Stable selected value accepted by composed combobox APIs.
 */
export type ComboboxCompositionValue = string | null;

/**
 * One option accepted by Combobox().
 */
export interface ComboboxCompositionItem {
    value?: string;
    label: ComboboxCompositionContent;
    disabled?: boolean;
    optionOptions?: BaseCompositionOptions;
    textValue?: string;
}

/**
 * Partial option update accepted by combobox.update({ items }).
 */
export interface ComboboxCompositionItemUpdate {
    label?: ComboboxCompositionContent;
    disabled?: boolean;
    optionOptions?: BaseCompositionOptions;
    textValue?: string | null;
}

/**
 * Details passed when the composed combobox popup opens or closes.
 */
export type ComboboxCompositionOpenChangeDetail = ComboboxInstanceOpenChangeDetail;

/**
 * Details passed when the composed combobox input value changes.
 */
export interface ComboboxCompositionValueChangeDetail extends ComboboxInstanceValueChangeDetail {
    value: string | null;
    selectedItem: ComposedComboboxItem | null;
    selectedText: string | null;
}

/**
 * Details passed when the composed combobox active option changes.
 */
export interface ComboboxCompositionActiveOptionChangeDetail
    extends ComboboxInstanceActiveOptionChangeDetail {
    activeItem: ComposedComboboxItem | null;
}

/**
 * Called when the composed combobox popup opens or closes.
 */
export type ComboboxCompositionOnOpenChange = (
    detail: ComboboxCompositionOpenChangeDetail,
    combobox: ComposedCombobox
) => void;

/**
 * Called when the composed combobox input value changes.
 */
export type ComboboxCompositionOnValueChange = (
    detail: ComboboxCompositionValueChangeDetail,
    combobox: ComposedCombobox
) => void;

/**
 * Called when the composed combobox active option changes.
 */
export type ComboboxCompositionOnActiveOptionChange = (
    detail: ComboboxCompositionActiveOptionChangeDetail,
    combobox: ComposedCombobox
) => void;

/**
 * Options for Combobox().
 */
export interface ComboboxCompositionOptions
    extends Omit<
            ComboboxInstanceOptions,
            | "getOptions"
            | "getOptionText"
            | "isOptionDisabled"
            | "selectedOption"
            | "defaultSelectedOption"
            | "onOpenChange"
            | "onValueChange"
            | "onActiveOptionChange"
        >,
        BaseCompositionOptions {
    label?: string | null;
    labelOptions?: BaseCompositionOptions;
    inputOptions?: BaseCompositionOptions;
    listboxOptions?: BaseCompositionOptions;
    placeholder?: string | null;
    name?: string | null;
    required?: boolean;
    items: ComboboxCompositionItem[];
    value?: ComboboxCompositionValue;
    defaultValue?: ComboboxCompositionValue;
    notFoundText?: string | null;
    notFoundOptions?: BaseCompositionOptions;
    announceNotFound?: boolean;
    onOpenChange?: ComboboxCompositionOnOpenChange | null;
    onValueChange?: ComboboxCompositionOnValueChange | null;
    onActiveOptionChange?: ComboboxCompositionOnActiveOptionChange | null;
}

/**
 * Options accepted by ComposedCombobox.update().
 */
export interface ComboboxCompositionUpdateOptions
    extends Partial<
        Omit<
            ComboboxCompositionOptions,
            "items" | "defaultValue" | "defaultInputValue" | "defaultOpen"
        >
    > {
    items?: ComboboxCompositionItemUpdate[];
}

/**
 * One option created by the composition API.
 */
export interface ComposedComboboxItem {
    readonly value: string;
    readonly option: HTMLElement;
    setLabelContent(content: ComboboxCompositionContent): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    getText(): string;
}

/**
 * Combobox created by the composition API.
 */
export interface ComposedCombobox
    extends Omit<ComboboxInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly input: HTMLInputElement;
    readonly listbox: HTMLElement;
    readonly items: ComposedComboboxItem[];
    readonly notFound: HTMLElement;
    setNotFoundText(text: string | null): void;
    setItems(items: ComboboxCompositionItem[]): void;
    getLabelElement(): HTMLLabelElement | null;
    setLabel(label: string | null): void;
    getItem(value: string): ComposedComboboxItem | null;
    getSelectedItem(): ComposedComboboxItem | null;
    getSelectedValue(): string | null;
    setSelectedValue(value: ComboboxCompositionValue): boolean;
    getActiveItem(): ComposedComboboxItem | null;
    setActiveValue(value: ComboboxCompositionValue, options?: { scroll?: boolean }): boolean;
    update(options: ComboboxCompositionUpdateOptions): void;
    destroy(): void;
}

interface ComboboxItemNode {
    value: string;
    option: HTMLElement;
    labelContent: ReturnType<typeof createContentSlot>;
    disabled: boolean;
    textValue: string | null;
}

function getOptionalText(value: string | null | undefined): string {
    return value?.replace(/\s+/g, " ").trim() ?? "";
}

function hasNotFoundText(value: string | null | undefined): boolean {
    return getOptionalText(value).length > 0;
}

function getUniqueValue(
    item: ComboboxCompositionItem,
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

function syncItemDisabled(node: ComboboxItemNode, disabled: boolean): void {
    node.disabled = disabled;

    if (disabled) {
        node.option.setAttribute("aria-disabled", "true");
        node.option.setAttribute("data-af-disabled", "true");
    } else {
        node.option.removeAttribute("aria-disabled");
        node.option.removeAttribute("data-af-disabled");
    }
}

function applyOptionOptions(
    option: HTMLElement,
    options: BaseCompositionOptions | undefined
): void {
    applyCompositionElementOptions(option, options);
    option.setAttribute("data-af-combobox-option", "");
}

function createItemNodes(items: ComboboxCompositionItem[]): ComboboxItemNode[] {
    const usedValues = new Set<string>();

    return items.map((item, index): ComboboxItemNode => {
        const value = getUniqueValue(item, index, usedValues);
        const option = createElement("div", getCompositionElementOptions(
            item.optionOptions,
            { "data-af-combobox-option": "" }
        ));

        if (!option.id) {
            option.id = createId("af-combobox-option");
        }

        const node: ComboboxItemNode = {
            value,
            option,
            labelContent: createContentSlot(option, toCompositionChildren(item.label)),
            disabled: false,
            textValue: item.textValue ?? null,
        };

        syncItemDisabled(node, item.disabled ?? false);

        return node;
    });
}

function getOptionElementByValue(
    value: ComboboxCompositionValue | undefined,
    itemNodes: ComboboxItemNode[]
): HTMLElement | null {
    if (value === null || value === undefined) {
        return null;
    }

    return itemNodes.find((node) => node.value === value && !node.disabled)?.option ?? null;
}

function getComboboxOptionText(
    option: HTMLElement,
    itemNodes: ComboboxItemNode[]
): string {
    const node = itemNodes.find((candidate) => candidate.option === option);

    return node?.textValue ?? getElementText(option, node?.value ?? "");
}

function isComboboxOptionDisabled(
    option: HTMLElement,
    itemNodes: ComboboxItemNode[]
): boolean {
    return (
        itemNodes.find((node) => node.option === option)?.disabled
        ?? option.getAttribute("aria-disabled") === "true"
    );
}

function getInputAttributes(options: ComboboxCompositionOptions): ElementAttributes {
    const attributes: ElementAttributes = {
        "data-af-combobox-input": "",
        type: "text",
        autocomplete: "off"
    };

    if ("placeholder" in options) {
        attributes.placeholder = options.placeholder ?? null;
    }

    if ("name" in options) {
        attributes.name = options.name ?? null;
    }

    if (options.required !== undefined) {
        attributes.required = options.required;
    }

    return attributes;
}

function applyInputFormOptions(
    input: HTMLInputElement,
    options: Pick<
        ComboboxCompositionUpdateOptions,
        "placeholder" | "name" | "required"
    >
): void {
    if ("placeholder" in options) {
        setElementAttributeValue(input, "placeholder", options.placeholder ?? null);
    }

    if ("name" in options) {
        setElementAttributeValue(input, "name", options.name ?? null);
    }

    if (options.required !== undefined) {
        setElementAttributeValue(input, "required", options.required);
    }
}

function getComboboxOptions(
    options: ComboboxCompositionOptions,
    itemNodes: ComboboxItemNode[],
    onOpenChange: NonNullable<ComboboxInstanceOptions["onOpenChange"]>,
    onValueChange: NonNullable<ComboboxInstanceOptions["onValueChange"]>,
    onActiveOptionChange: NonNullable<ComboboxInstanceOptions["onActiveOptionChange"]>
): ComboboxInstanceOptions {
    const comboboxOptions: ComboboxInstanceOptions = {
        getOptions: () => itemNodes.map((node) => node.option),
        getOptionText: (option) => getComboboxOptionText(option, itemNodes),
        isOptionDisabled: (option) => isComboboxOptionDisabled(option, itemNodes),
        onOpenChange,
        onValueChange,
        onActiveOptionChange
    };

    if ("value" in options) {
        comboboxOptions.selectedOption = getOptionElementByValue(options.value, itemNodes);
    } else if ("defaultValue" in options) {
        comboboxOptions.defaultSelectedOption = getOptionElementByValue(options.defaultValue, itemNodes);
    }

    if ("filterOption" in options) comboboxOptions.filterOption = options.filterOption ?? null;
    if (options.inputValue !== undefined) comboboxOptions.inputValue = options.inputValue;
    if (options.defaultInputValue !== undefined) comboboxOptions.defaultInputValue = options.defaultInputValue;
    if (options.autocomplete !== undefined) comboboxOptions.autocomplete = options.autocomplete;
    if (options.disabled !== undefined) comboboxOptions.disabled = options.disabled;
    if (options.open !== undefined) comboboxOptions.open = options.open;
    if (options.defaultOpen !== undefined) comboboxOptions.defaultOpen = options.defaultOpen;
    if (options.openOnFocus !== undefined) comboboxOptions.openOnFocus = options.openOnFocus;
    if (options.openOnInput !== undefined) comboboxOptions.openOnInput = options.openOnInput;
    if (options.closeOnBlur !== undefined) comboboxOptions.closeOnBlur = options.closeOnBlur;
    if (options.closeOnEmpty !== undefined) {
        comboboxOptions.closeOnEmpty = options.closeOnEmpty;
    } else if (hasNotFoundText(options.notFoundText)) {
        comboboxOptions.closeOnEmpty = false;
    }
    if (options.loop !== undefined) comboboxOptions.loop = options.loop;
    if (options.side !== undefined) comboboxOptions.side = options.side;
    if (options.alignment !== undefined) comboboxOptions.alignment = options.alignment;
    if (options.strategy !== undefined) comboboxOptions.strategy = options.strategy;
    if (options.offset !== undefined) comboboxOptions.offset = options.offset;
    if (options.crossAxisOffset !== undefined) comboboxOptions.crossAxisOffset = options.crossAxisOffset;
    if (options.collisionPadding !== undefined) comboboxOptions.collisionPadding = options.collisionPadding;
    if (options.flip !== undefined) comboboxOptions.flip = options.flip;
    if (options.shift !== undefined) comboboxOptions.shift = options.shift;
    if (options.matchAnchorWidth !== undefined) comboboxOptions.matchAnchorWidth = options.matchAnchorWidth;
    if (options.autoUpdate !== undefined) comboboxOptions.autoUpdate = options.autoUpdate;
    if (options.variant !== undefined) comboboxOptions.variant = options.variant;
    if (options.size !== undefined) comboboxOptions.size = options.size;
    if (options.dismissKeyboardOnSelection !== undefined) {
        comboboxOptions.dismissKeyboardOnSelection = options.dismissKeyboardOnSelection;
    }

    return comboboxOptions;
}

function getComboboxUpdateOptions(
    options: ComboboxCompositionUpdateOptions,
    itemNodes: ComboboxItemNode[]
): ComboboxInstanceUpdateOptions {
    const comboboxOptions: ComboboxInstanceUpdateOptions = {};

    if ("value" in options) {
        comboboxOptions.selectedOption = getOptionElementByValue(options.value ?? null, itemNodes);
    }

    if ("filterOption" in options) comboboxOptions.filterOption = options.filterOption ?? null;
    if (options.inputValue !== undefined) comboboxOptions.inputValue = options.inputValue;
    if (options.autocomplete !== undefined) comboboxOptions.autocomplete = options.autocomplete;
    if (options.disabled !== undefined) comboboxOptions.disabled = options.disabled;
    if (options.open !== undefined) comboboxOptions.open = options.open;
    if (options.openOnFocus !== undefined) comboboxOptions.openOnFocus = options.openOnFocus;
    if (options.openOnInput !== undefined) comboboxOptions.openOnInput = options.openOnInput;
    if (options.closeOnBlur !== undefined) comboboxOptions.closeOnBlur = options.closeOnBlur;
    if (options.closeOnEmpty !== undefined) {
        comboboxOptions.closeOnEmpty = options.closeOnEmpty;
    } else if ("notFoundText" in options) {
        comboboxOptions.closeOnEmpty = !hasNotFoundText(options.notFoundText);
    }
    if (options.loop !== undefined) comboboxOptions.loop = options.loop;
    if (options.side !== undefined) comboboxOptions.side = options.side;
    if (options.alignment !== undefined) comboboxOptions.alignment = options.alignment;
    if (options.strategy !== undefined) comboboxOptions.strategy = options.strategy;
    if (options.offset !== undefined) comboboxOptions.offset = options.offset;
    if (options.crossAxisOffset !== undefined) comboboxOptions.crossAxisOffset = options.crossAxisOffset;
    if (options.collisionPadding !== undefined) comboboxOptions.collisionPadding = options.collisionPadding;
    if (options.flip !== undefined) comboboxOptions.flip = options.flip;
    if (options.shift !== undefined) comboboxOptions.shift = options.shift;
    if (options.matchAnchorWidth !== undefined) comboboxOptions.matchAnchorWidth = options.matchAnchorWidth;
    if (options.autoUpdate !== undefined) comboboxOptions.autoUpdate = options.autoUpdate;
    if (options.variant !== undefined) comboboxOptions.variant = options.variant;
    if (options.size !== undefined) comboboxOptions.size = options.size;
    if (options.dismissKeyboardOnSelection !== undefined) {
        comboboxOptions.dismissKeyboardOnSelection = options.dismissKeyboardOnSelection;
    }

    return comboboxOptions;
}

function getItemSourceUpdateOptions(
    nodes: ComboboxItemNode[]
): ComboboxInstanceUpdateOptions {
    return {
        getOptions: () => nodes.map((node) => node.option),
        getOptionText: (option) => getComboboxOptionText(option, nodes),
        isOptionDisabled: (option) => isComboboxOptionDisabled(option, nodes)
    };
}

/**
 * Creates an editable combobox with a labelled input and listbox popup.
 */
export function Combobox(options: ComboboxCompositionOptions): ComposedCombobox {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "combobox"
    }));

    const input = createElement("input", getCompositionElementOptions(
        options.inputOptions,
        getInputAttributes(options)
    ));

    const listbox = createElement("div", getCompositionElementOptions(options.listboxOptions, {
        "data-af-combobox-listbox": ""
    }));

    const notFound = createElement("div", getCompositionElementOptions(options.notFoundOptions, {
        "data-af-combobox-not-found": "",
        "data-af-disabled": "true",
        role: "option",
        "aria-disabled": "true"
    }));

    notFound.textContent = getOptionalText(options.notFoundText);
    notFound.hidden = true;

    let itemNodes = createItemNodes(options.items);

    for (const node of itemNodes) {
        listbox.append(node.option);
    }

    listbox.append(notFound);

    element.append(input, listbox);

    let composed!: ComposedCombobox;
    let labelElement: HTMLLabelElement | null = null;
    let onOpenChange = options.onOpenChange ?? null;
    let onValueChange = options.onValueChange ?? null;
    let onActiveOptionChange = options.onActiveOptionChange ?? null;

    let announceNotFound = options.announceNotFound ?? true;
    let announcer: Announcer | null = null;
    let notFoundAnnounced = false;

    function createComposedItem(node: ComboboxItemNode): ComposedComboboxItem {
        return {
            value: node.value,
            option: node.option,

            setLabelContent(content): void {
                node.labelContent.set(toCompositionChildren(content));
            },

            setDisabled(disabled): void {
                syncItemDisabled(node, disabled);
                combobox.refresh();
            },

            isDisabled(): boolean {
                return node.disabled;
            },

            getText(): string {
                return getElementText(node.option, node.value);
            }
        };
    }

    function disposeItemNodes(nodes: ComboboxItemNode[]): void {
        for (const node of nodes) {
            node.labelContent.dispose();
        }
    }

    const composedItems: ComposedComboboxItem[] = itemNodes.map(createComposedItem);

    function setItems(items: ComboboxCompositionItem[]): void {
        disposeItemNodes(itemNodes);

        itemNodes = createItemNodes(items);
        composedItems.splice(0, composedItems.length, ...itemNodes.map(createComposedItem));
        listbox.replaceChildren(...itemNodes.map((node) => node.option), notFound);

        combobox.update(getItemSourceUpdateOptions(itemNodes));
        syncNotFoundState();
    }

    function ensureInputId(): string {
        if (!input.id) {
            input.id = createId("af-combobox");
        }

        return input.id;
    }

    function ensureLabelElement(): HTMLLabelElement {
        if (labelElement) {
            return labelElement;
        }

        labelElement = createElement("label", getCompositionElementOptions(options.labelOptions, {
            "data-af-combobox-label": "",
            for: ensureInputId()
        }));

        element.insertBefore(labelElement, input);

        return labelElement;
    }

    function syncLabelFor(): void {
        if (labelElement) {
            labelElement.htmlFor = ensureInputId();
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
        nextLabel.setAttribute("data-af-combobox-label", "");
        syncLabelFor();
    }

    function syncNotFoundAttributes(): void {
        notFound.setAttribute("data-af-combobox-not-found", "");
        notFound.setAttribute("data-af-disabled", "true");
        notFound.setAttribute("role", "option");
        notFound.setAttribute("aria-disabled", "true");
    }

    function shouldShowNotFound(): boolean {
        return (
            hasNotFoundText(notFound.textContent)
            && combobox.isOpen()
            && combobox.getInputValue().trim().length > 0
            && combobox.getVisibleOptions().length === 0
        );
    }

    function syncNotFoundState(options: { announce?: boolean } = {}): void {
        const visible = shouldShowNotFound();

        notFound.hidden = !visible;

        if (!visible) {
            notFoundAnnounced = false;
            return;
        }

        combobox.updatePosition();

        if (options.announce && announceNotFound && !notFoundAnnounced) {
            announcer ??= createAnnouncer();
            announcer.announce(getOptionalText(notFound.textContent));
            notFoundAnnounced = true;
        }
    }

    function setNotFoundText(text: string | null): void {
        notFound.textContent = getOptionalText(text);
        combobox.update({ closeOnEmpty: !hasNotFoundText(text) });
        syncNotFoundState();
    }

    function getItem(value: string): ComposedComboboxItem | null {
        return composedItems.find((item) => item.value === value) ?? null;
    }

    function getItemByOption(option: HTMLElement | null): ComposedComboboxItem | null {
        return composedItems.find((item) => item.option === option) ?? null;
    }

    function getSelectedItem(): ComposedComboboxItem | null {
        return getItemByOption(combobox.getSelectedOption());
    }

    function getActiveItem(): ComposedComboboxItem | null {
        return getItemByOption(combobox.getActiveOption());
    }

    const handleOpenChange: NonNullable<ComboboxInstanceOptions["onOpenChange"]> = (detail): void => {
        syncNotFoundState();
        onOpenChange?.(detail, composed);
    };

    const handleValueChange: NonNullable<ComboboxInstanceOptions["onValueChange"]> = (detail): void => {
        const selectedItem = getItemByOption(detail.selectedOption);

        syncNotFoundState({ announce: detail.reason === "input" });

        onValueChange?.(
            {
                ...detail,
                value: selectedItem?.value ?? null,
                selectedItem,
                selectedText: selectedItem?.getText() ?? null
            },
            composed
        );
    };

    const handleActiveOptionChange: NonNullable<ComboboxInstanceOptions["onActiveOptionChange"]> = (detail): void => {
        onActiveOptionChange?.(
            {
                ...detail,
                activeItem: getItemByOption(detail.activeOption)
            },
            composed
        );
    };

    setLabel(options.label ?? null);

    const combobox = createComboboxComponent(
        input,
        listbox,
        getComboboxOptions(
            options,
            itemNodes,
            handleOpenChange,
            handleValueChange,
            handleActiveOptionChange
        )
    );

    composed = {
        ...combobox,
        element,
        input,
        listbox,
        items: composedItems,
        notFound,
        setNotFoundText,
        setItems,

        getLabelElement(): HTMLLabelElement | null {
            return labelElement;
        },

        setLabel,
        getItem,
        getSelectedItem,

        getSelectedValue(): string | null {
            return getSelectedItem()?.value ?? null;
        },

        setSelectedValue(value): boolean {
            return combobox.setSelectedOption(getOptionElementByValue(value, itemNodes));
        },

        getActiveItem,

        setActiveValue(value, setOptions): boolean {
            return combobox.setActiveOption(getOptionElementByValue(value, itemNodes), setOptions);
        },

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.inputOptions !== undefined) {
                applyCompositionElementOptions(input, nextOptions.inputOptions);
                input.setAttribute("data-af-combobox-input", "");
                syncLabelFor();
            }

            if (nextOptions.listboxOptions !== undefined) {
                applyCompositionElementOptions(listbox, nextOptions.listboxOptions);
                listbox.setAttribute("data-af-combobox-listbox", "");
            }

            if (nextOptions.notFoundOptions !== undefined) {
                applyCompositionElementOptions(notFound, nextOptions.notFoundOptions);
                syncNotFoundAttributes();
            }

            if ("notFoundText" in nextOptions) {
                notFound.textContent = getOptionalText(nextOptions.notFoundText);
            }

            if (nextOptions.announceNotFound !== undefined) {
                announceNotFound = nextOptions.announceNotFound;
            }

            applyInputFormOptions(input, nextOptions);

            if ("label" in nextOptions) {
                setLabel(nextOptions.label ?? null);
            }

            if (nextOptions.labelOptions !== undefined && labelElement) {
                applyCompositionElementOptions(labelElement, nextOptions.labelOptions);
                labelElement.setAttribute("data-af-combobox-label", "");
                syncLabelFor();
            }

            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if ("onValueChange" in nextOptions) {
                onValueChange = nextOptions.onValueChange ?? null;
            }

            if ("onActiveOptionChange" in nextOptions) {
                onActiveOptionChange = nextOptions.onActiveOptionChange ?? null;
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
                        syncItemDisabled(node, nextItem.disabled);
                    }

                    if ("textValue" in nextItem) {
                        node.textValue = nextItem.textValue ?? null;
                    }
                });
            }

            combobox.update(getComboboxUpdateOptions(nextOptions, itemNodes));
            syncNotFoundState();
        },

        destroy(): void {
            labelElement?.remove();
            disposeItemNodes(itemNodes);
            announcer?.destroy();
            announcer = null;
            combobox.destroy();
        }
    };

    return composed;
}
