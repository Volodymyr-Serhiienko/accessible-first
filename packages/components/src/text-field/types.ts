import type { FormFieldInvalidState } from "../../../core/src/form-field";
import type { Component } from "../foundation";

/**
 * Native control element supported by TextField.
 */
export type TextFieldElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Visual variant for text field.
 */
export type TextFieldVariant = "default" | "plain";

/**
 * Text field size token.
 */
export type TextFieldSize = "md";

/**
 * Single-line input types supported by TextField.
 */
export type TextFieldInputType = "text" | "email" | "password" | "search" | "tel" | "url" | "number";

/**
 * Details passed when the text field value changes.
 */
export interface TextFieldValueChangeDetail {
    value: string;
    event: Event;
}

/**
 * Called on native input events while the user types.
 */
export type TextFieldOnValueInput = (
    detail: TextFieldValueChangeDetail,
    textField: TextField
) => void;

/**
 * Called on native change events, usually after editing is committed.
 */
export type TextFieldOnValueChange = (
    detail: TextFieldValueChangeDetail,
    textField: TextField
) => void;

/**
 * Options for createTextField().
 */
export interface TextFieldOptions {
    value?: string;
    defaultValue?: string;
    type?: TextFieldInputType;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
    invalid?: FormFieldInvalidState;
    name?: string | null;
    placeholder?: string | null;
    autocomplete?: string | null;
    inputMode?: string | null;
    minLength?: number | null;
    maxLength?: number | null;
    pattern?: string | null;
    variant?: TextFieldVariant;
    size?: TextFieldSize;
    onValueInput?: TextFieldOnValueInput | null;
    onValueChange?: TextFieldOnValueChange | null;
}

/**
 * Options accepted by textField.update().
 *
 * defaultValue is creation-time only.
 */
export interface TextFieldUpdateOptions extends Partial<Omit<TextFieldOptions, "defaultValue">> {}

/**
 * Text field component controller returned by createTextField().
 */
export interface TextField extends Component<TextFieldElement> {
    readonly control: TextFieldElement;
    getValue(): string;
    setValue(value: string): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setRequired(required: boolean): void;
    isRequired(): boolean;
    setReadOnly(readOnly: boolean): void;
    isReadOnly(): boolean;
    setInvalid(invalid: FormFieldInvalidState): void;
    update(options: TextFieldUpdateOptions): void;
}
