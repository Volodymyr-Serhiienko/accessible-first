import type { FormFieldInvalidState } from "../../../core/src/form-field";
import type { Component } from "../foundation";

/**
 * Visual variant for switch.
 */
export type SwitchVariant = "default" | "plain";

/**
 * Switch size token.
 */
export type SwitchSize = "md";

/**
 * Details passed when native switch value changes.
 */
export interface SwitchChangeDetail {
    checked: boolean;
    event: Event;
}

/**
 * Called when switch checked state changes through user interaction.
 */
export type SwitchOnCheckedChange = (
    detail: SwitchChangeDetail,
    switchControl: Switch
) => void;

/**
 * Options for createSwitch().
 */
export interface SwitchOptions {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: FormFieldInvalidState;
    name?: string | null;
    value?: string | null;
    variant?: SwitchVariant;
    size?: SwitchSize;
    onCheckedChange?: SwitchOnCheckedChange | null;
}

/**
 * Options accepted by switch.update().
 *
 * defaultChecked is creation-time only.
 */
export interface SwitchUpdateOptions extends Partial<Omit<SwitchOptions, "defaultChecked">> {}

/**
 * Switch component controller returned by createSwitch().
 */
export interface Switch extends Component<HTMLInputElement> {
    readonly input: HTMLInputElement;
    setChecked(checked: boolean): void;
    getChecked(): boolean;
    isChecked(): boolean;
    toggleChecked(force?: boolean): boolean;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setRequired(required: boolean): void;
    isRequired(): boolean;
    setInvalid(invalid: FormFieldInvalidState): void;
    update(options: SwitchUpdateOptions): void;
}
