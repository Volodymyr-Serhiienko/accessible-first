import type { AriaReferences } from "../../../core/src/aria";
import type { ButtonPressedState, ButtonVariant } from "../button";
import type { Component } from "../foundation";

/**
 * Defines the scale or size layout variant of an icon button component.
 */
export type IconButtonSize = "md";

/**
 * Configuration options used to initialize an accessible interactive icon button component.
 * Because icon buttons lack visible textual titles, explicit labelling configurations 
 * (`label` or `labelledBy`) are critical to ensure accessibility compliance.
 */
export interface IconButtonOptions {
    label?: string | null;
    labelledBy?: AriaReferences;
    disabled?: boolean;
    pressed?: ButtonPressedState;
    type?: "button" | "submit" | "reset";
    variant?: ButtonVariant;
    size?: IconButtonSize;
    onPress?: (event: Event) => void;
}

/**
 * Interface representing an accessible interactive icon button control component.
 * Ensures standalone functional visual icons maintain structural labels for screen readers 
 * alongside native interactive blockades, design variants, and toggle behaviors.
 */
export interface IconButton extends Component {
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setPressed(pressed: ButtonPressedState): void;
    getPressed(): ButtonPressedState;
    setLabel(label: string | null): void;
    setLabelledBy(labelledBy: AriaReferences): void;
    update(options: IconButtonOptions): void;
}
