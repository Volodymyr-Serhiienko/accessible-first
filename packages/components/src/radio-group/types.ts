import type { FormFieldInvalidState } from "../../../core/src/form-field";
import type { Component } from "../foundation";

/**
 * Visual variant for radio group.
 */
export type RadioGroupVariant = "default" | "plain";

/**
 * Radio group size token.
 */
export type RadioGroupSize = "md";

/**
 * Visual item flow for the radio group.
 */
export type RadioGroupOrientation = "vertical" | "horizontal";

/**
 * Value accepted by radio group APIs.
 */
export type RadioGroupValue = string | null;

/**
 * Returns whether a specific radio input should stay disabled.
 */
export type RadioGroupIsRadioDisabled = (radio: HTMLInputElement) => boolean;

/**
 * Details passed when native radio group value changes.
 */
export interface RadioGroupChangeDetail {
    value: RadioGroupValue;
    input: HTMLInputElement | null;
    event: Event;
}

/**
 * Called when radio group value changes through user interaction.
 */
export type RadioGroupOnValueChange = (
    detail: RadioGroupChangeDetail,
    radioGroup: RadioGroup
) => void;

/**
 * Options for createRadioGroup().
 */
export interface RadioGroupOptions {
    radios?: HTMLInputElement[];
    value?: RadioGroupValue;
    defaultValue?: RadioGroupValue;
    disabled?: boolean;
    required?: boolean;
    invalid?: FormFieldInvalidState;
    name?: string;
    orientation?: RadioGroupOrientation;
    variant?: RadioGroupVariant;
    size?: RadioGroupSize;
    isRadioDisabled?: RadioGroupIsRadioDisabled;
    onValueChange?: RadioGroupOnValueChange | null;
}

/**
 * Options accepted by radioGroup.update().
 *
 * defaultValue is creation-time only.
 */
export interface RadioGroupUpdateOptions extends Partial<Omit<RadioGroupOptions, "defaultValue">> {}

/**
 * Radio group component controller returned by createRadioGroup().
 */
export interface RadioGroup extends Component<HTMLElement> {
    readonly group: HTMLElement;
    readonly radios: HTMLInputElement[];
    getValue(): RadioGroupValue;
    getSelectedInput(): HTMLInputElement | null;
    setValue(value: RadioGroupValue): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setRequired(required: boolean): void;
    isRequired(): boolean;
    setInvalid(invalid: FormFieldInvalidState): void;
    refresh(): void;
    update(options: RadioGroupUpdateOptions): void;
}
