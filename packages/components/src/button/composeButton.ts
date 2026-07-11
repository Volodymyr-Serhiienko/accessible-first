import {
    createContentSlot,
    createElement,
    type BaseCompositionOptions,
    type CompositionChild,
    type CreateElementOptions
} from "../composition";
import { createButton } from "./createButton";
import type { Button as ButtonInstance, ButtonOptions } from "./types";

/**
 * Configuration characteristics defining functional behaviors, custom accessibility modifiers, 
 * base properties, and child rendering layouts for an interactive Button element.
 */
export interface ButtonCompositionOptions extends ButtonOptions, BaseCompositionOptions {
    text?: string;
    children?: CompositionChild[];
}

/**
 * Interface representing a managed, accessibly enhanced native HTMLButtonElement wrapper.
 * Houses core structural references while providing functional controls to alter content streams, 
 * apply runtime attribute modifications, and cleanly purge listener structures.
 */
export interface ComposedButton extends Omit<ButtonInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLButtonElement;
    setText(text: string): void;
    update(options: ButtonCompositionOptions): void;
    destroy(): void;
}

function getElementOptions(options: ButtonCompositionOptions): CreateElementOptions {
    const elementOptions: CreateElementOptions = {};

    if (options.id !== undefined) elementOptions.id = options.id;
    if (options.className !== undefined) elementOptions.className = options.className;
    if (options.attributes !== undefined) elementOptions.attributes = options.attributes;

    return elementOptions;
}

function getChildren(options: ButtonCompositionOptions): CompositionChild[] {
    if (options.children !== undefined) {
        return options.children;
    }

    if (options.text !== undefined) {
        return [options.text];
    }

    return [];
}

/**
 * Instantiates and coordinates an enhanced, accessibly sound native HTMLButtonElement wrapper.
 * Integrates interactive state management hooks alongside dynamic inner content slots to 
 * naturally handle text updates, custom sub-component composition, and seamless runtime adjustments 
 * while anchoring proper semantic markup structure.
 *
 * @param options - Visual properties, initial text strings, and layout behaviors applied at creation time.
 * @returns An interactive ComposedButton interface with layout updating and lifecycle destruction controls.
 */
export function Button(options: ButtonCompositionOptions = {}): ComposedButton {
    const element = createElement("button", getElementOptions(options));
    const content = createContentSlot(element, getChildren(options));
    const button = createButton(element, options);

    function setText(text: string): void {
        content.set([text]);
    }

    return {
        ...button,
        element,
        setText,

        update(nextOptions: ButtonCompositionOptions): void {
            button.update(nextOptions);

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
}
