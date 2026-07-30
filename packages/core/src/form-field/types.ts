import type { AriaReferences } from "../aria";

/**
 * Values supported by aria-invalid.
 */
export type FormFieldInvalidState = boolean | "grammar" | "spelling";

/**
 * Accessible relationships and states that can be applied to a control.
 */
export interface FormFieldUpdateOptions {
    label?: AriaReferences;
    description?: AriaReferences;
    errorMessage?: AriaReferences;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: FormFieldInvalidState;
}

/**
 * Options for createFormField().
 */
export interface FormFieldOptions extends FormFieldUpdateOptions {}

/**
 * Controller for accessible form-field relationships and states.
 */
export interface FormField {
    readonly control: HTMLElement;
    update(options: FormFieldUpdateOptions): void;
    setLabel(label: AriaReferences): void;
    setDescription(description: AriaReferences): void;
    setErrorMessage(errorMessage: AriaReferences): void;
    setRequired(required: boolean): void;
    setDisabled(disabled: boolean): void;
    setReadOnly(readOnly: boolean): void;
    setInvalid(invalid: FormFieldInvalidState): void;
    destroy(): void;
}
