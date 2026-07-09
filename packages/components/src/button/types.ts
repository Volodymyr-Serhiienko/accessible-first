import type { Component } from "../foundation";

/**
 * Defines the semantic theme or structural visual variant of a button component.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/**
 * Defines the scale or size layout variant of a button component.
 */
export type ButtonSize = "md";

/**
 * Represents the active state evaluation for toggle buttons under WAI-ARIA standards.
 * - `boolean`: `true` indicates the control is actively engaged; `false` indicates unpressed.
 * - `"mixed"`: Indicates a partial or indeterminate selection across a group of dependent items.
 * - `null`: The button functions as a standard push button without toggle behaviors.
 */
export type ButtonPressedState = boolean | "mixed" | null;

/**
 * Configuration options used to initialize an interactive accessible button component.
 */
export interface ButtonOptions {
    disabled?: boolean;
    pressed?: ButtonPressedState;
    type?: "button" | "submit" | "reset";
    variant?: ButtonVariant;
    size?: ButtonSize;
    onPress?: (event: Event) => void;
}

/**
 * Interface representing an accessible interactive button control component.
 * Extends baseline component states to synchronize design variance attributes, 
 * native input restrictions, toggled activation records (`aria-pressed`), and safe action handling hooks.
 */
export interface Button extends Component {
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setPressed(pressed: ButtonPressedState): void;
    getPressed(): ButtonPressedState;
    update(options: ButtonOptions): void;
}
