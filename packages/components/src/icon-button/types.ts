import type { AriaReferences } from "../../../core/src/aria";
import type { ButtonPressedState, ButtonVariant } from "../button";
import type { Component } from "../foundation";

/**
 * Icon button size token.
 */
export type IconButtonSize = "md";

/**
 * Options for createIconButton().
 * Provide label or labelledBy for icon-only controls.
 */
export interface IconButtonOptions {
    label?: string | null;
    labelledBy?: AriaReferences;
    disabled?: boolean;
    pressed?: ButtonPressedState;
    type?: "button" | "submit" | "reset";
    variant?: ButtonVariant;
    size?: IconButtonSize;
    onPress?: ((event: Event) => void) | null;
}

/**
 * Options accepted by iconButton.update().
 */
export interface IconButtonUpdateOptions extends Partial<IconButtonOptions> {}

/**
 * Icon button behavior controller returned by createIconButton().
 */
export interface IconButton extends Component {
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setPressed(pressed: ButtonPressedState): void;
    getPressed(): ButtonPressedState;
    setLabel(label: string | null): void;
    setLabelledBy(labelledBy: AriaReferences): void;
    update(options: IconButtonUpdateOptions): void;
}
