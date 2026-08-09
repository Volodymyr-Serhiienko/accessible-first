import { createFormField, type FormFieldInvalidState } from "../../../core/src/form-field";
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
import { createCheckbox as createCheckboxComponent } from "./createCheckbox";
import type {
    Checkbox as CheckboxInstance,
    CheckboxChangeDetail,
    CheckboxCheckedState,
    CheckboxOptions,
    CheckboxSize,
    CheckboxVariant
} from "./types";

/**
 * Content accepted by checkbox label, description, and error slots.
 */
export type CheckboxCompositionContent = CompositionContent;

/**
 * Details passed when a composed checkbox changes.
 */
export type CheckboxCompositionChangeDetail = CheckboxChangeDetail;

/**
 * Called when a composed checkbox changes through user interaction.
 */
export type CheckboxCompositionOnCheckedChange = (
    detail: CheckboxCompositionChangeDetail,
    checkbox: ComposedCheckbox
) => void;

/**
 * Options for Checkbox().
 */
export interface CheckboxCompositionOptions
    extends Omit<CheckboxOptions, "onCheckedChange">,
        BaseCompositionOptions {
    label: CheckboxCompositionContent;
    description?: CheckboxCompositionContent | null;
    errorMessage?: CheckboxCompositionContent | null;
    inputOptions?: BaseCompositionOptions;
    labelOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    errorOptions?: BaseCompositionOptions;
    variant?: CheckboxVariant;
    size?: CheckboxSize;
    onCheckedChange?: CheckboxCompositionOnCheckedChange | null;
}

/**
 * Options accepted by ComposedCheckbox.update().
 *
 * defaultChecked is creation-time only.
 */
export interface CheckboxCompositionUpdateOptions
    extends Partial<Omit<CheckboxCompositionOptions, "defaultChecked">> {}

/**
 * Checkbox created by the composition API.
 */
export interface ComposedCheckbox
    extends Omit<CheckboxInstance, "element" | "input" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly input: HTMLInputElement;
    readonly label: HTMLLabelElement;
    readonly description: HTMLElement;
    readonly errorMessage: HTMLElement;
    setLabelContent(content: CheckboxCompositionContent): void;
    setDescription(content: CheckboxCompositionContent | null): void;
    setErrorMessage(content: CheckboxCompositionContent | null): void;
    update(options: CheckboxCompositionUpdateOptions): void;
    destroy(): void;
}

function getElementText(element: HTMLElement): string {
    return element.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function hasVisibleContent(element: HTMLElement): boolean {
    return getElementText(element).length > 0;
}

function getCheckboxOptions(
    options: Partial<CheckboxCompositionOptions>,
    onCheckedChange: NonNullable<CheckboxOptions["onCheckedChange"]>
): CheckboxOptions {
    const checkboxOptions: CheckboxOptions = {
        onCheckedChange
    };

    if ("checked" in options) checkboxOptions.checked = options.checked ?? false;
    if (options.defaultChecked !== undefined) checkboxOptions.defaultChecked = options.defaultChecked;
    if (options.disabled !== undefined) checkboxOptions.disabled = options.disabled;
    if (options.required !== undefined) checkboxOptions.required = options.required;
    if (options.invalid !== undefined) checkboxOptions.invalid = options.invalid;
    if ("name" in options) checkboxOptions.name = options.name ?? null;
    if ("value" in options) checkboxOptions.value = options.value ?? null;
    if (options.variant !== undefined) checkboxOptions.variant = options.variant;
    if (options.size !== undefined) checkboxOptions.size = options.size;

    return checkboxOptions;
}

/**
 * Creates an accessible native checkbox with label, description, and error slots.
 */
export function Checkbox(options: CheckboxCompositionOptions): ComposedCheckbox {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "checkbox"
    }));

    const input = createElement("input", getCompositionElementOptions(options.inputOptions, {
        "data-af-checkbox-input": "",
        type: "checkbox"
    }));

    if (!input.id) {
        input.id = createId("af-checkbox");
    }

    const label = createElement("label", getCompositionElementOptions(options.labelOptions, {
        "data-af-checkbox-label": "",
        for: input.id
    }));

    const indicator = createElement("span", {
        attributes: {
            "data-af-checkbox-indicator": "",
            "aria-hidden": "true"
        }
    });

    const labelText = createElement("span", {
        attributes: {
            "data-af-checkbox-label-text": ""
        }
    });

    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-checkbox-description": ""
    }));

    const errorMessage = createElement("div", getCompositionElementOptions(options.errorOptions, {
        "data-af-checkbox-error": ""
    }));

    const labelSlot = createContentSlot(labelText, toCompositionChildren(options.label));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(options.description));
    const errorSlot = createContentSlot(errorMessage, toCompositionChildren(options.errorMessage));

    label.append(indicator, labelText);
    element.append(input, label, description, errorMessage);

    let composed!: ComposedCheckbox;
    let onCheckedChange = options.onCheckedChange ?? null;
    let invalid: FormFieldInvalidState = options.invalid ?? false;

    const formField = createFormField(input);

    function syncInputId(): void {
        if (!input.id) {
            input.id = createId("af-checkbox");
        }

        label.htmlFor = input.id;
    }

    function syncDescriptionVisibility(): void {
        description.hidden = !hasVisibleContent(description);
    }

    function syncErrorVisibility(): void {
        errorMessage.hidden = !hasVisibleContent(errorMessage);
    }

    function syncFormFieldReferences(): void {
        syncInputId();
        syncDescriptionVisibility();
        syncErrorVisibility();

        formField.setLabel(label);
        formField.setDescription(description.hidden ? null : description);
        formField.setErrorMessage(!invalid || errorMessage.hidden ? null : errorMessage);
    }

    function setDescription(content: CheckboxCompositionContent | null): void {
        descriptionSlot.set(toCompositionChildren(content));
        syncFormFieldReferences();
    }

    function setErrorMessage(content: CheckboxCompositionContent | null): void {
        errorSlot.set(toCompositionChildren(content));
        syncFormFieldReferences();
    }

    function setLabelContent(content: CheckboxCompositionContent): void {
        labelSlot.set(toCompositionChildren(content));
        syncFormFieldReferences();
    }

    const checkbox = createCheckboxComponent(
        input,
        getCheckboxOptions(options, (detail) => {
            onCheckedChange?.(detail, composed);
        })
    );

    syncFormFieldReferences();

    composed = {
        ...checkbox,
        element,
        input,
        label,
        description,
        errorMessage,
        setLabelContent,
        setDescription,
        setErrorMessage,

        setInvalid(nextInvalid): void {
            invalid = nextInvalid;
            checkbox.setInvalid(nextInvalid);
            syncFormFieldReferences();
        },

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.inputOptions !== undefined) {
                applyCompositionElementOptions(input, nextOptions.inputOptions);
                input.setAttribute("data-af-checkbox-input", "");
                input.type = "checkbox";
                syncInputId();
            }

            if (nextOptions.labelOptions !== undefined) {
                applyCompositionElementOptions(label, nextOptions.labelOptions);
                label.setAttribute("data-af-checkbox-label", "");
                syncInputId();
            }

            if (nextOptions.descriptionOptions !== undefined) {
                applyCompositionElementOptions(description, nextOptions.descriptionOptions);
                description.setAttribute("data-af-checkbox-description", "");
            }

            if (nextOptions.errorOptions !== undefined) {
                applyCompositionElementOptions(errorMessage, nextOptions.errorOptions);
                errorMessage.setAttribute("data-af-checkbox-error", "");
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

            if ("onCheckedChange" in nextOptions) {
                onCheckedChange = nextOptions.onCheckedChange ?? null;
            }

            if (nextOptions.invalid !== undefined) {
                invalid = nextOptions.invalid;
            }

            checkbox.update(getCheckboxOptions(nextOptions, (detail) => {
                onCheckedChange?.(detail, composed);
            }));

            syncFormFieldReferences();
        },

        destroy(): void {
            labelSlot.dispose();
            descriptionSlot.dispose();
            errorSlot.dispose();
            formField.destroy();
            checkbox.destroy();
        }
    };

    return composed;
}
