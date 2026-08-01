import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type CompositionChild
} from "../composition";
import { createButton } from "./createButton";
import {
    createSelectedState,
    type SelectedStateOptions
} from "../foundation";
import type { Button as ButtonInstance, ButtonOptions } from "./types";

/**
 * Called when the composed button is activated.
 * Receives the native event and the composed button instance.
 */
export type ButtonCompositionOnPress = (
    event: Event,
    button: ComposedButton
) => void;

/**
 * Options for Button(), the composition API that creates and enhances a native button.
 * Use `text` for simple labels or `children` for richer content.
 */
export interface ButtonCompositionOptions
    extends Omit<ButtonOptions, "onPress">,
        BaseCompositionOptions {
    text?: string;
    children?: CompositionChild[];
    selected?: boolean;
    onPress?: ButtonCompositionOnPress | null;
}

/**
 * A button created by Button().
 * Includes the enhanced button behavior plus content and lifecycle helpers.
 */
export interface ComposedButton extends Omit<ButtonInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLButtonElement;
    setText(text: string): void;
    setSelected(selected: boolean): void;
    isSelected(): boolean;
    toggleSelected(force?: boolean): boolean;
    update(options: Partial<ButtonCompositionOptions>): void;
    destroy(): void;
}

function getChildren(options: ButtonCompositionOptions): CompositionChild[] {
    if (options.children !== undefined) return options.children;
    if (options.text !== undefined) return [options.text];
    return [];
}

function getButtonOptions(
    options: Partial<ButtonCompositionOptions>,
    onPress: (event: Event) => void
): ButtonOptions {
    const buttonOptions: ButtonOptions = {
        onPress
    };

    if (options.disabled !== undefined) buttonOptions.disabled = options.disabled;
    if ("pressed" in options) buttonOptions.pressed = options.pressed ?? null;
    if (options.type !== undefined) buttonOptions.type = options.type;
    if (options.variant !== undefined) buttonOptions.variant = options.variant;
    if (options.size !== undefined) buttonOptions.size = options.size;

    return buttonOptions;
}

function getSelectedStateOptions(
    options: Pick<ButtonCompositionOptions, "selected">
): SelectedStateOptions {
    const selectedOptions: SelectedStateOptions = {};

    if (options.selected !== undefined) {
        selectedOptions.selected = options.selected;
    }

    return selectedOptions;
}

/**
 * Creates an accessible button with default styling hooks and optional composed content.
 */
export function Button(options: ButtonCompositionOptions = {}): ComposedButton {
    const element = createElement("button", getCompositionElementOptions(options));
    const content = createContentSlot(element, getChildren(options));
    const selectedState = createSelectedState(element, getSelectedStateOptions(options));

    let composed!: ComposedButton;
    let onPress = options.onPress ?? null;

    const button = createButton(
        element,
        getButtonOptions(options, (event) => {
            onPress?.(event, composed);
        })
    );

    function setText(text: string): void {
        content.set([text]);
    }

    composed = {
        ...button,
        element,
        setText,
        setSelected: selectedState.setSelected,
        isSelected: selectedState.isSelected,
        toggleSelected: selectedState.toggleSelected,

        update(nextOptions: Partial<ButtonCompositionOptions>): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("onPress" in nextOptions) {
                onPress = nextOptions.onPress ?? null;
            }

            if (nextOptions.selected !== undefined) {
                selectedState.setSelected(nextOptions.selected);
            }

            button.update(getButtonOptions(nextOptions, (event) => {
                onPress?.(event, composed);
            }));

            if (nextOptions.children !== undefined) {
                content.set(nextOptions.children);
            } else if (nextOptions.text !== undefined) {
                setText(nextOptions.text);
            }
        },

        destroy(): void {
            content.dispose();
            selectedState.destroy();
            button.destroy();
        }
    };

    return composed;
}
