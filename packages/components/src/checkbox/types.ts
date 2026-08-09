import type { FormFieldInvalidState } from "../../../core/src/form-field";
import type { Component } from "../foundation";

/**
 * Visual variant for checkbox.
 */
export type CheckboxVariant = "default" | "plain";

/**
 * Checkbox size token.
 */
export type CheckboxSize = "md";

/**
 * Checked state accepted by checkbox APIs.
 *
 * "mixed" maps to the native indeterminate checkbox state.
 */
export type CheckboxCheckedState = boolean | "mixed";

/**
 * Details passed when the native checkbox value changes.
 */
export interface CheckboxChangeDetail {
    checked: boolean;
    checkedState: CheckboxCheckedState;
    event: Event;
}

/**
 * Called when checkbox checked state changes through user interaction.
 */
export type CheckboxOnCheckedChange = (
    detail: CheckboxChangeDetail,
    checkbox: Checkbox
) => void;

/**
 * Options for createCheckbox().
 */
export interface CheckboxOptions {
    checked?: CheckboxCheckedState;
    defaultChecked?: CheckboxCheckedState;
    disabled?: boolean;
    required?: boolean;
    invalid?: FormFieldInvalidState;
    name?: string | null;
    value?: string | null;
    variant?: CheckboxVariant;
    size?: CheckboxSize;
    onCheckedChange?: CheckboxOnCheckedChange | null;
}

/**
 * Options accepted by checkbox.update().
 *
 * defaultChecked is creation-time only.
 */
export interface CheckboxUpdateOptions extends Partial<Omit<CheckboxOptions, "defaultChecked">> {}

/**
 * Checkbox component controller returned by createCheckbox().
 */
export interface Checkbox extends Component<HTMLInputElement> {
    readonly input: HTMLInputElement;
    setChecked(checked: CheckboxCheckedState): void;
    getChecked(): CheckboxCheckedState;
    isChecked(): boolean;
    toggleChecked(force?: boolean): boolean;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setRequired(required: boolean): void;
    isRequired(): boolean;
    setInvalid(invalid: FormFieldInvalidState): void;
    update(options: CheckboxUpdateOptions): void;
}
