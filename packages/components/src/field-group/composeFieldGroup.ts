import { createFormField, type FormFieldInvalidState } from "../../../core/src/form-field";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    hasVisibleContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";

/**
 * Content accepted by field group label, description, error, and body slots.
 */
export type FieldGroupCompositionContent = CompositionContent;

/**
 * Controls whether the visible FieldGroup description is connected with aria-describedby.
 */
export type FieldGroupDescriptionMode = "content" | "aria";

/**
 * Visual variant for FieldGroup.
 */
export type FieldGroupVariant = "default" | "plain";

/**
 * FieldGroup size token.
 */
export type FieldGroupSize = "md";

/**
 * Layout direction for controls inside the group body.
 */
export type FieldGroupOrientation = "vertical" | "horizontal";

/**
 * Options for FieldGroup().
 */
export interface FieldGroupOptions extends BaseCompositionOptions {
    label: FieldGroupCompositionContent;
    description?: FieldGroupCompositionContent | null;
    errorMessage?: FieldGroupCompositionContent | null;
    children?: FieldGroupCompositionContent;
    disabled?: boolean;
    required?: boolean;
    invalid?: FormFieldInvalidState;
    descriptionMode?: FieldGroupDescriptionMode;
    orientation?: FieldGroupOrientation;
    variant?: FieldGroupVariant;
    size?: FieldGroupSize;
    legendOptions?: BaseCompositionOptions;
    bodyOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    errorOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedFieldGroup.update().
 */
export interface FieldGroupUpdateOptions extends Partial<FieldGroupOptions> {}

/**
 * Field group created by the composition API.
 */
export interface ComposedFieldGroup extends ComposedNode<HTMLFieldSetElement> {
    readonly element: HTMLFieldSetElement;
    readonly group: HTMLFieldSetElement;
    readonly legend: HTMLLegendElement;
    readonly description: HTMLElement;
    readonly errorMessage: HTMLElement;
    readonly body: HTMLElement;
    setLabelContent(content: FieldGroupCompositionContent): void;
    setDescription(content: FieldGroupCompositionContent | null): void;
    setErrorMessage(content: FieldGroupCompositionContent | null): void;
    setChildren(content: FieldGroupCompositionContent | null): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setRequired(required: boolean): void;
    isRequired(): boolean;
    setInvalid(invalid: FormFieldInvalidState): void;
    getInvalid(): FormFieldInvalidState;
    setOrientation(orientation: FieldGroupOrientation): void;
    update(options: FieldGroupUpdateOptions): void;
    destroy(): void;
}

function hasInvalidState(invalid: FormFieldInvalidState): boolean {
    return invalid !== false;
}

/**
 * Creates a semantic fieldset/legend group for related form controls.
 */
export function FieldGroup(options: FieldGroupOptions): ComposedFieldGroup {
    const element = createElement("fieldset", getCompositionElementOptions(options, {
        "data-af-composition": "field-group",
        "data-af-component": "field-group"
    }));

    const legend = createElement("legend", getCompositionElementOptions(options.legendOptions, {
        "data-af-field-group-legend": ""
    }));

    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-field-group-description": ""
    }));

    const errorMessage = createElement("div", getCompositionElementOptions(options.errorOptions, {
        "data-af-field-group-error": ""
    }));

    const body = createElement("div", getCompositionElementOptions(options.bodyOptions, {
        "data-af-field-group-body": ""
    }));

    const legendSlot = createContentSlot(legend, toCompositionChildren(options.label));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(options.description));
    const errorSlot = createContentSlot(errorMessage, toCompositionChildren(options.errorMessage));
    const bodySlot = createContentSlot(body, toCompositionChildren(options.children));

    element.append(legend, description, errorMessage, body);

    let disabled = options.disabled ?? element.disabled;
    let required = options.required ?? false;
    let invalid: FormFieldInvalidState = options.invalid ?? false;
    let descriptionMode: FieldGroupDescriptionMode = options.descriptionMode ?? "aria";
    let orientation: FieldGroupOrientation = options.orientation ?? "vertical";
    let variant: FieldGroupVariant = options.variant ?? "default";
    let size: FieldGroupSize = options.size ?? "md";

    const formField = createFormField(element);

    function sync(): void {
        description.hidden = !hasVisibleContent(description);
        errorMessage.hidden = !hasVisibleContent(errorMessage);

        element.setAttribute("data-af-composition", "field-group");
        element.setAttribute("data-af-component", "field-group");
        element.setAttribute("data-af-orientation", orientation);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.toggleAttribute("data-af-invalid", hasInvalidState(invalid));

        if (disabled) {
            element.setAttribute("data-af-state", "disabled");
        } else {
            element.removeAttribute("data-af-state");
        }

        legend.toggleAttribute("data-af-required", required);

        formField.setLabel(legend);
        formField.setDescription(
            descriptionMode === "aria" && !description.hidden ? description : null
        );
        formField.setErrorMessage(!hasInvalidState(invalid) || errorMessage.hidden ? null : errorMessage);
        formField.setRequired(required);
        formField.setDisabled(disabled);
        formField.setInvalid(invalid);
    }

    function setLabelContent(content: FieldGroupCompositionContent): void {
        legendSlot.set(toCompositionChildren(content));
        sync();
    }

    function setDescription(content: FieldGroupCompositionContent | null): void {
        descriptionSlot.set(toCompositionChildren(content));
        sync();
    }

    function setErrorMessage(content: FieldGroupCompositionContent | null): void {
        errorSlot.set(toCompositionChildren(content));
        sync();
    }

    function setChildren(content: FieldGroupCompositionContent | null): void {
        bodySlot.set(toCompositionChildren(content));
    }

    sync();

    return {
        element,
        group: element,
        legend,
        description,
        errorMessage,
        body,
        setLabelContent,
        setDescription,
        setErrorMessage,
        setChildren,

        setDisabled(nextDisabled): void {
            disabled = nextDisabled;
            sync();
        },

        isDisabled(): boolean {
            return disabled;
        },

        setRequired(nextRequired): void {
            required = nextRequired;
            sync();
        },

        isRequired(): boolean {
            return required;
        },

        setInvalid(nextInvalid): void {
            invalid = nextInvalid;
            sync();
        },

        getInvalid(): FormFieldInvalidState {
            return invalid;
        },

        setOrientation(nextOrientation): void {
            orientation = nextOrientation;
            sync();
        },

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.legendOptions !== undefined) {
                applyCompositionElementOptions(legend, nextOptions.legendOptions);
                legend.setAttribute("data-af-field-group-legend", "");
            }

            if (nextOptions.bodyOptions !== undefined) {
                applyCompositionElementOptions(body, nextOptions.bodyOptions);
                body.setAttribute("data-af-field-group-body", "");
            }

            if (nextOptions.descriptionOptions !== undefined) {
                applyCompositionElementOptions(description, nextOptions.descriptionOptions);
                description.setAttribute("data-af-field-group-description", "");
            }

            if (nextOptions.errorOptions !== undefined) {
                applyCompositionElementOptions(errorMessage, nextOptions.errorOptions);
                errorMessage.setAttribute("data-af-field-group-error", "");
            }

            if (nextOptions.label !== undefined) setLabelContent(nextOptions.label);
            if ("description" in nextOptions) setDescription(nextOptions.description ?? null);
            if ("errorMessage" in nextOptions) setErrorMessage(nextOptions.errorMessage ?? null);
            if ("children" in nextOptions) setChildren(nextOptions.children ?? null);

            if (nextOptions.disabled !== undefined) disabled = nextOptions.disabled;
            if (nextOptions.required !== undefined) required = nextOptions.required;
            if (nextOptions.invalid !== undefined) invalid = nextOptions.invalid;
            if (nextOptions.descriptionMode !== undefined) descriptionMode = nextOptions.descriptionMode;
            if (nextOptions.orientation !== undefined) orientation = nextOptions.orientation;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy(): void {
            legendSlot.dispose();
            descriptionSlot.dispose();
            errorSlot.dispose();
            bodySlot.dispose();
            formField.destroy();
        }
    };
}
