import type { AriaReferences } from "../aria";

/**
 * Defines the validation error state configurations for an accessible form control field.
 * - `boolean`: `true` flags a generic semantic validation error; `false` indicates valid status.
 * - `"grammar"`: Flags a specific grammatical error condition for semantic assistive engines.
 * - `"spelling"`: Flags a localized spelling error condition for semantic assistive engines.
 */
export type FormFieldInvalidState = boolean | "grammar" | "spelling";

/**
 * Operational payload data properties used to update accessible state attributes 
 * and linked relationships on an interactive form input.
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
 * Configuration options for initializing an accessible form field controller instance.
 */
export interface FormFieldOptions extends FormFieldUpdateOptions {}

/**
 * Interface representing an accessible form field layout wrapper controller.
 * Orchestrates real-time sync mutations across input fields, applying native interactive flags, 
 * descriptive relationships (`aria-describedby`), error warnings (`aria-errormessage`), 
 * and accessibility structures (`aria-invalid`).
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
