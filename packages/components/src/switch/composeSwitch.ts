import { createFormField, type FormFieldInvalidState } from "../../../core/src/form-field";
import { createId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    hasVisibleContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent
} from "../composition";
import { createSwitch as createSwitchComponent } from "./createSwitch";
import type {
    Switch as SwitchInstance,
    SwitchChangeDetail,
    SwitchOptions,
    SwitchSize,
    SwitchVariant
} from "./types";

/**
 * Content accepted by switch label, description, and error slots.
 */
export type SwitchCompositionContent = CompositionContent;

/**
 * Details passed when a composed switch changes.
 */
export type SwitchCompositionChangeDetail = SwitchChangeDetail;

/**
 * Called when a composed switch changes through user interaction.
 */
export type SwitchCompositionOnCheckedChange = (
    detail: SwitchCompositionChangeDetail,
    switchControl: ComposedSwitch
) => void;

/**
 * Options for Switch().
 */
export interface SwitchCompositionOptions
    extends Omit<SwitchOptions, "onCheckedChange">,
        BaseCompositionOptions {
    label: SwitchCompositionContent;
    description?: SwitchCompositionContent | null;
    errorMessage?: SwitchCompositionContent | null;
    inputOptions?: BaseCompositionOptions;
    labelOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    errorOptions?: BaseCompositionOptions;
    variant?: SwitchVariant;
    size?: SwitchSize;
    onCheckedChange?: SwitchCompositionOnCheckedChange | null;
}

/**
 * Options accepted by ComposedSwitch.update().
 *
 * defaultChecked is creation-time only.
 */
export interface SwitchCompositionUpdateOptions
    extends Partial<Omit<SwitchCompositionOptions, "defaultChecked">> {}

/**
 * Switch created by the composition API.
 */
export interface ComposedSwitch
    extends Omit<SwitchInstance, "element" | "input" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly input: HTMLInputElement;
    readonly label: HTMLLabelElement;
    readonly description: HTMLElement;
    readonly errorMessage: HTMLElement;
    setLabelContent(content: SwitchCompositionContent): void;
    setDescription(content: SwitchCompositionContent | null): void;
    setErrorMessage(content: SwitchCompositionContent | null): void;
    update(options: SwitchCompositionUpdateOptions): void;
    destroy(): void;
}

function getSwitchOptions(
    options: Partial<SwitchCompositionOptions>,
    onCheckedChange: NonNullable<SwitchOptions["onCheckedChange"]>
): SwitchOptions {
    const switchOptions: SwitchOptions = {
        onCheckedChange
    };

    if ("checked" in options) switchOptions.checked = options.checked ?? false;
    if (options.defaultChecked !== undefined) switchOptions.defaultChecked = options.defaultChecked;
    if (options.disabled !== undefined) switchOptions.disabled = options.disabled;
    if (options.required !== undefined) switchOptions.required = options.required;
    if (options.invalid !== undefined) switchOptions.invalid = options.invalid;
    if ("name" in options) switchOptions.name = options.name ?? null;
    if ("value" in options) switchOptions.value = options.value ?? null;
    if (options.variant !== undefined) switchOptions.variant = options.variant;
    if (options.size !== undefined) switchOptions.size = options.size;

    return switchOptions;
}

/**
 * Creates an accessible switch with label, description, and error slots.
 */
export function Switch(options: SwitchCompositionOptions): ComposedSwitch {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "switch"
    }));

    const input = createElement("input", getCompositionElementOptions(options.inputOptions, {
        "data-af-switch-input": "",
        type: "checkbox"
    }));

    if (!input.id) {
        input.id = createId("af-switch");
    }

    const label = createElement("label", getCompositionElementOptions(options.labelOptions, {
        "data-af-switch-label": "",
        for: input.id
    }));

    const track = createElement("span", {
        attributes: {
            "data-af-switch-track": "",
            "aria-hidden": "true"
        }
    });

    const thumb = createElement("span", {
        attributes: {
            "data-af-switch-thumb": ""
        }
    });

    const labelText = createElement("span", {
        attributes: {
            "data-af-switch-label-text": ""
        }
    });

    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-switch-description": ""
    }));

    const errorMessage = createElement("div", getCompositionElementOptions(options.errorOptions, {
        "data-af-switch-error": ""
    }));

    const labelSlot = createContentSlot(labelText, toCompositionChildren(options.label));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(options.description));
    const errorSlot = createContentSlot(errorMessage, toCompositionChildren(options.errorMessage));

    track.append(thumb);
    label.append(track, labelText);
    element.append(input, label, description, errorMessage);

    let composed!: ComposedSwitch;
    let onCheckedChange = options.onCheckedChange ?? null;
    let invalid: FormFieldInvalidState = options.invalid ?? false;

    const formField = createFormField(input);

    function syncInputId(): void {
        if (!input.id) {
            input.id = createId("af-switch");
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

    function setDescription(content: SwitchCompositionContent | null): void {
        descriptionSlot.set(toCompositionChildren(content));
        syncFormFieldReferences();
    }

    function setErrorMessage(content: SwitchCompositionContent | null): void {
        errorSlot.set(toCompositionChildren(content));
        syncFormFieldReferences();
    }

    function setLabelContent(content: SwitchCompositionContent): void {
        labelSlot.set(toCompositionChildren(content));
        syncFormFieldReferences();
    }

    const switchControl = createSwitchComponent(
        input,
        getSwitchOptions(options, (detail) => {
            onCheckedChange?.(detail, composed);
        })
    );

    syncFormFieldReferences();

    composed = {
        ...switchControl,
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
            switchControl.setInvalid(nextInvalid);
            syncFormFieldReferences();
        },

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.inputOptions !== undefined) {
                applyCompositionElementOptions(input, nextOptions.inputOptions);
                input.setAttribute("data-af-switch-input", "");
                input.type = "checkbox";
                input.setAttribute("role", "switch");
                syncInputId();
            }

            if (nextOptions.labelOptions !== undefined) {
                applyCompositionElementOptions(label, nextOptions.labelOptions);
                label.setAttribute("data-af-switch-label", "");
                syncInputId();
            }

            if (nextOptions.descriptionOptions !== undefined) {
                applyCompositionElementOptions(description, nextOptions.descriptionOptions);
                description.setAttribute("data-af-switch-description", "");
            }

            if (nextOptions.errorOptions !== undefined) {
                applyCompositionElementOptions(errorMessage, nextOptions.errorOptions);
                errorMessage.setAttribute("data-af-switch-error", "");
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

            switchControl.update(getSwitchOptions(nextOptions, (detail) => {
                onCheckedChange?.(detail, composed);
            }));

            syncFormFieldReferences();
        },

        destroy(): void {
            labelSlot.dispose();
            descriptionSlot.dispose();
            errorSlot.dispose();
            formField.destroy();
            switchControl.destroy();
        }
    };

    return composed;
}
