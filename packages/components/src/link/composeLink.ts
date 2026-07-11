import {
    createContentSlot,
    createElement,
    type BaseCompositionOptions,
    type CompositionChild,
    type CreateElementOptions
} from "../composition";
import { createLink } from "./createLink";
import type { Link as LinkInstance, LinkOptions } from "./types";

/**
 * Configuration characteristics defining navigation behaviors, interaction states, 
 * base properties, and child rendering layouts for an accessibly sound Link element.
 */
export interface LinkCompositionOptions extends LinkOptions, BaseCompositionOptions {
    text?: string;
    children?: CompositionChild[];
}

/**
 * Interface representing a managed, accessibly enhanced native HTMLAnchorElement wrapper.
 * Houses core structural navigation references while providing functional controls to alter content streams, 
 * apply runtime attribute modifications, and cleanly purge listener structures during unmounting.
 */
export interface ComposedLink extends Omit<LinkInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLAnchorElement;
    setText(text: string): void;
    update(options: LinkCompositionOptions): void;
    destroy(): void;
}

function getElementOptions(options: LinkCompositionOptions): CreateElementOptions {
    const elementOptions: CreateElementOptions = {};

    if (options.id !== undefined) elementOptions.id = options.id;
    if (options.className !== undefined) elementOptions.className = options.className;
    if (options.attributes !== undefined) elementOptions.attributes = options.attributes;

    return elementOptions;
}

function getChildren(options: LinkCompositionOptions): CompositionChild[] {
    if (options.children !== undefined) {
        return options.children;
    }

    if (options.text !== undefined) {
        return [options.text];
    }

    return [];
}

/**
 * Instantiates and coordinates an enhanced, accessibly sound native HTMLAnchorElement wrapper.
 * Integrates navigational state management hooks alongside dynamic inner content slots to 
 * naturally handle text updates, custom sub-component composition, and seamless runtime adjustments 
 * while anchoring proper semantic markup structure.
 *
 * @param options - Navigation traits, initial text strings, and layout behaviors applied at creation time.
 * @returns An interactive ComposedLink interface with layout updating and lifecycle destruction controls.
 */
export function Link(options: LinkCompositionOptions = {}): ComposedLink {
    const element = createElement("a", getElementOptions(options));
    const content = createContentSlot(element, getChildren(options));
    const link = createLink(element, options);

    function setText(text: string): void {
        content.set([text]);
    }

    return {
        ...link,
        element,
        setText,

        update(nextOptions: LinkCompositionOptions): void {
            link.update(nextOptions);

            if (nextOptions.children !== undefined) {
                content.set(nextOptions.children);
            } else if (nextOptions.text !== undefined) {
                setText(nextOptions.text);
            }
        },

        destroy(): void {
            content.dispose();
            link.destroy();
        }
    };
}
