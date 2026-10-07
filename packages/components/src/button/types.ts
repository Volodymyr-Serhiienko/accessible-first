import type { Component, PendingStateOptions } from "../foundation";

/**
 * Visual style variant for a button.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/**
 * Button size token.
 */
export type ButtonSize = "md";

/**
 * aria-pressed value for toggle buttons.
 * null means the button is a regular push button.
 */
export type ButtonPressedState = boolean | "mixed" | null;

/**
 * Options for createButton().
 */
export interface ButtonOptions extends PendingStateOptions {
    disabled?: boolean;
    pressed?: ButtonPressedState;
    type?: "button" | "submit" | "reset";
    variant?: ButtonVariant;
    size?: ButtonSize;
    onPress?: ((event: Event) => void) | null;
}

/**
 * Options accepted by button.update().
 */
export interface ButtonUpdateOptions extends Partial<ButtonOptions> {}

/**
 * Button behavior controller returned by createButton().
 */
export interface Button extends Component {
    setPending(pending: boolean): void;
    isPending(): boolean;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setPressed(pressed: ButtonPressedState): void;
    getPressed(): ButtonPressedState;
    update(options: ButtonUpdateOptions): void;
}
