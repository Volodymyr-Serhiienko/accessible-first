import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type CompositionChild
} from "../composition";
import { createButton } from "./createButton";
import type { Button as ButtonInstance, ButtonOptions } from "./types";

/**
 * Callback function signature executed when an interactive button component receives an operational activation event.
 * Passes both the original native DOM interaction event and the orchestrating component controller context.
 * 
 * @param event - The native browser Event object triggered by pointer, keyboard, or voice activation.
 * @param button - The contextual ComposedButton manager instance executing the action.
 */
export type ButtonCompositionOnPress = (
    event: Event,
    button: ComposedButton
) => void;

/**
 * Configuration characteristics defining functional behaviors, accessibility state variations, 
 * event pipelines, and nested layout content arrays for an interactive Button element.
 */
export interface ButtonCompositionOptions
    extends Omit<ButtonOptions, "onPress">,
        BaseCompositionOptions {
    text?: string;
    children?: CompositionChild[];
    onPress?: ButtonCompositionOnPress | null;
}

/**
 * Interface representing a managed, accessibly enhanced native HTMLButtonElement wrapper.
 * Houses core structural references while providing functional controls to alter layout content streams, 
 * apply runtime trait modifications, and cleanly purge listener structures during unmounting.
 */
export interface ComposedButton extends Omit<ButtonInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLButtonElement;
    setText(text: string): void;
    update(options: ButtonCompositionOptions): void;
    destroy(): void;
}

function getChildren(options: ButtonCompositionOptions): CompositionChild[] {
    if (options.children !== undefined) return options.children;
    if (options.text !== undefined) return [options.text];
    return [];
}

function getButtonOptions(
    options: ButtonCompositionOptions,
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

/**
 * Instantiates and coordinates an enhanced, accessibly sound native HTMLButtonElement wrapper with dynamic event injection.
 * Integrates interactive focus and click state management pipelines, hooks up context-aware activation event overrides 
 * (`onPress`), and sets up isolated inner content slots to securely process typography shifts and sub-tree 
 * composition updates without breaking parent memory tables.
 *
 * @param options - Visual properties, action hooks, content payloads, and layout identifiers assigned at initialization.
 * @returns An interactive ComposedButton manager offering unified properties, layout updates, and unmounting methods.
 */
export function Button(options: ButtonCompositionOptions = {}): ComposedButton {
    const element = createElement("button", getCompositionElementOptions(options));
    const content = createContentSlot(element, getChildren(options));

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

        update(nextOptions: ButtonCompositionOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("onPress" in nextOptions) {
                onPress = nextOptions.onPress ?? null;
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
            button.destroy();
        }
    };

    return composed;
}
