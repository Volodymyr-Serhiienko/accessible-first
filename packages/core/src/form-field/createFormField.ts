import {
    setAriaAttribute,
    setAriaDescribedBy,
    setAriaDisabled,
    setAriaLabelledBy,
    setAriaReferences,
    type AriaReference,
    type AriaReferences
} from "../aria";
import { ensureId } from "../id";
import type {
    FormField,
    FormFieldInvalidState,
    FormFieldOptions,
    FormFieldUpdateOptions
} from "./types";

function toReferenceList(references: AriaReferences): AriaReference[] {
    return Array.isArray(references) ? references : [references];
}

function getReferenceElements(references: AriaReferences): HTMLElement[] {
    return toReferenceList(references).filter(
        (reference): reference is HTMLElement => reference instanceof HTMLElement
    );
}

function isLabelElement(element: HTMLElement): element is HTMLLabelElement {
    return element.localName === "label";
}

function supportsNativeDisabled(element: HTMLElement): boolean {
    return ["button", "fieldset", "input", "optgroup", "option", "select", "textarea"]
        .includes(element.localName);
}

function supportsNativeRequired(element: HTMLElement): boolean {
    return ["input", "select", "textarea"].includes(element.localName);
}

function supportsNativeReadOnly(element: HTMLElement): boolean {
    return ["input", "textarea"].includes(element.localName);
}

function setBooleanAttribute(
    element: HTMLElement,
    name: string,
    value: boolean
): void {
    if (value) {
        element.setAttribute(name, "");
        return;
    }

    element.removeAttribute(name);
}

function restoreAttribute(
    element: HTMLElement,
    name: string,
    value: string | null
): void {
    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
}

/**
 * Creates and initializes an accessible form field controller instance.
 * Decorates an interactive input control node by syncing native functional tracking flags 
 * (`disabled`, `required`, `readonly`) alongside explicit structural WAI-ARIA relational metadata maps 
 * (`aria-labelledby`, `aria-describedby`, `aria-errormessage`, `aria-invalid`).
 * Caches previous DOM property modifications to guarantee pristine markup restoration upon teardown.
 *
 * @param control - The primary underlying target input, select, or textarea HTMLElement being decorated.
 * @param options - Initial operational states and descriptive text node references to apply immediately.
 * @returns A FormField modifier object exposing atomic mutation sets and dynamic lifecycle hooks.
 */
export function createFormField(
    control: HTMLElement,
    options: FormFieldOptions = {}
): FormField {
    const originalAttributes = new Map<HTMLElement, Map<string, string | null>>();

    let destroyed = false;

    let label: AriaReferences = null;
    let description: AriaReferences = null;
    let errorMessage: AriaReferences = null;
    let required = false;
    let disabled = false;
    let readOnly = false;
    let invalid: FormFieldInvalidState = false;

    let hasLabel = false;
    let hasDescription = false;
    let hasErrorMessage = false;
    let hasRequired = false;
    let hasDisabled = false;
    let hasReadOnly = false;
    let hasInvalid = false;

    function rememberAttribute(element: HTMLElement, name: string): void {
        let attributes = originalAttributes.get(element);

        if (!attributes) {
            attributes = new Map<string, string | null>();
            originalAttributes.set(element, attributes);
        }

        if (!attributes.has(name)) {
            attributes.set(name, element.getAttribute(name));
        }
    }

    function rememberReferenceIds(references: AriaReferences): void {
        for (const element of getReferenceElements(references)) {
            rememberAttribute(element, "id");
        }
    }

    function restoreAttributes(): void {
        for (const [element, attributes] of originalAttributes) {
            for (const [name, value] of attributes) {
                restoreAttribute(element, name, value);
            }
        }

        originalAttributes.clear();
    }

    function getDescriptionReferences(): AriaReference[] {
        const references: AriaReference[] = [];

        if (hasDescription) {
            references.push(...toReferenceList(description).filter(Boolean));
        }

        if (hasErrorMessage) {
            references.push(...toReferenceList(errorMessage).filter(Boolean));
        }

        return references;
    }

    function syncLabel(): void {
        if (!hasLabel) {
            return;
        }

        rememberAttribute(control, "aria-labelledby");
        rememberReferenceIds(label);

        for (const labelElement of getReferenceElements(label)) {
            if (!isLabelElement(labelElement)) {
                continue;
            }

            rememberAttribute(control, "id");
            rememberAttribute(labelElement, "for");

            labelElement.htmlFor = ensureId(control, "af-field");
        }

        setAriaLabelledBy(control, label);
    }

    function syncDescriptions(): void {
        if (!hasDescription && !hasErrorMessage) {
            return;
        }

        rememberAttribute(control, "aria-describedby");
        rememberAttribute(control, "aria-errormessage");

        rememberReferenceIds(description);
        rememberReferenceIds(errorMessage);

        const descriptions = getDescriptionReferences();

        setAriaDescribedBy(control, descriptions.length > 0 ? descriptions : null);
        setAriaReferences(
            control,
            "aria-errormessage",
            hasErrorMessage ? errorMessage : null,
            "af-error"
        );
    }

    function syncRequired(): void {
        if (!hasRequired) {
            return;
        }

        rememberAttribute(control, "required");
        rememberAttribute(control, "aria-required");

        if (supportsNativeRequired(control)) {
            setBooleanAttribute(control, "required", required);
        }

        setAriaAttribute(control, "aria-required", required ? true : null);
    }

    function syncDisabled(): void {
        if (!hasDisabled) {
            return;
        }

        rememberAttribute(control, "disabled");
        rememberAttribute(control, "aria-disabled");

        if (supportsNativeDisabled(control)) {
            setBooleanAttribute(control, "disabled", disabled);
        }

        setAriaDisabled(control, disabled ? true : null);
    }

    function syncReadOnly(): void {
        if (!hasReadOnly) {
            return;
        }

        rememberAttribute(control, "readonly");
        rememberAttribute(control, "aria-readonly");

        if (supportsNativeReadOnly(control)) {
            setBooleanAttribute(control, "readonly", readOnly);
        }

        setAriaAttribute(control, "aria-readonly", readOnly ? true : null);
    }

    function syncInvalid(): void {
        if (!hasInvalid) {
            return;
        }

        rememberAttribute(control, "aria-invalid");
        setAriaAttribute(control, "aria-invalid", invalid ? invalid : null);
    }

    function update(nextOptions: FormFieldUpdateOptions): void {
        if ("label" in nextOptions) {
            formField.setLabel(nextOptions.label);
        }

        if ("description" in nextOptions) {
            formField.setDescription(nextOptions.description);
        }

        if ("errorMessage" in nextOptions) {
            formField.setErrorMessage(nextOptions.errorMessage);
        }

        if (nextOptions.required !== undefined) {
            formField.setRequired(nextOptions.required);
        }

        if (nextOptions.disabled !== undefined) {
            formField.setDisabled(nextOptions.disabled);
        }

        if (nextOptions.readOnly !== undefined) {
            formField.setReadOnly(nextOptions.readOnly);
        }

        if (nextOptions.invalid !== undefined) {
            formField.setInvalid(nextOptions.invalid);
        }
    }

    const formField: FormField = {
        control,

        update,

        setLabel(nextLabel: AriaReferences): void {
            if (destroyed) return;

            hasLabel = true;
            label = nextLabel;
            syncLabel();
        },

        setDescription(nextDescription: AriaReferences): void {
            if (destroyed) return;

            hasDescription = true;
            description = nextDescription;
            syncDescriptions();
        },

        setErrorMessage(nextErrorMessage: AriaReferences): void {
            if (destroyed) return;

            hasErrorMessage = true;
            errorMessage = nextErrorMessage;
            syncDescriptions();
        },

        setRequired(nextRequired: boolean): void {
            if (destroyed) return;

            hasRequired = true;
            required = nextRequired;
            syncRequired();
        },

        setDisabled(nextDisabled: boolean): void {
            if (destroyed) return;

            hasDisabled = true;
            disabled = nextDisabled;
            syncDisabled();
        },

        setReadOnly(nextReadOnly: boolean): void {
            if (destroyed) return;

            hasReadOnly = true;
            readOnly = nextReadOnly;
            syncReadOnly();
        },

        setInvalid(nextInvalid: FormFieldInvalidState): void {
            if (destroyed) return;

            hasInvalid = true;
            invalid = nextInvalid;
            syncInvalid();
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;
            restoreAttributes();
        }
    };

    update(options);

    return formField;
}
