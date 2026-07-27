import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type CompositionChild
} from "../composition";
import { createLink } from "./createLink";
import type { Link as LinkInstance, LinkOptions } from "./types";

/**
 * Callback function signature executed when an interactive link component handles a navigation routing trigger.
 * Passes both the original native DOM interaction event and the orchestrating component controller context.
 * 
 * @param event - The native browser Event object triggered by pointer, keyboard, or voice activation.
 * @param link - The contextual ComposedLink manager instance executing the navigation behavior.
 */
export type LinkCompositionOnNavigate = (
    event: Event,
    link: ComposedLink
) => void;

/**
 * Configuration characteristics defining navigation behaviors, interaction states, 
 * event pipelines, and nested layout content arrays for an accessibly sound Link element.
 */
export interface LinkCompositionOptions
    extends Omit<LinkOptions, "onNavigate">,
        BaseCompositionOptions {
    text?: string;
    children?: CompositionChild[];
    onNavigate?: LinkCompositionOnNavigate | null;
}

/**
 * Interface representing a managed, accessibly enhanced native HTMLAnchorElement wrapper.
 * Houses core structural navigation references while providing functional controls to alter content streams, 
 * apply runtime trait modifications, manage route interception pipelines, and cleanly purge listener structures.
 */
export interface ComposedLink extends Omit<LinkInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLAnchorElement;
    setText(text: string): void;
    update(options: LinkCompositionOptions): void;
    destroy(): void;
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

function getLinkOptions(
    options: LinkCompositionOptions,
    onNavigate: (event: Event) => void
): LinkOptions {
    const linkOptions: LinkOptions = {
        onNavigate
    };

    if ("href" in options) {
        linkOptions.href = options.href ?? null;
    }

    if (options.disabled !== undefined) {
        linkOptions.disabled = options.disabled;
    }

    if (options.external !== undefined) {
        linkOptions.external = options.external;
    }

    if ("target" in options) {
        linkOptions.target = options.target ?? null;
    }

    if ("rel" in options) {
        linkOptions.rel = options.rel ?? null;
    }

    if ("current" in options) {
        linkOptions.current = options.current ?? null;
    }

    if (options.variant !== undefined) {
        linkOptions.variant = options.variant;
    }

    if (options.size !== undefined) {
        linkOptions.size = options.size;
    }

    return linkOptions;
}

/**
 * Instantiates and coordinates an enhanced, accessibly sound native HTMLAnchorElement wrapper with dynamic event injection.
 * Integrates navigational state management pipelines, hooks up context-aware routing event overrides (`onNavigate`), 
 * and sets up isolated inner content slots to securely process typography shifts and sub-tree 
 * composition updates without breaking parent memory tables.
 *
 * @param options - Navigation traits, action hooks, content payloads, and layout identifiers assigned at initialization.
 * @returns An interactive ComposedLink manager offering unified properties, layout updates, and unmounting methods.
 */
export function Link(options: LinkCompositionOptions = {}): ComposedLink {
    const element = createElement("a", getCompositionElementOptions(options));
    const content = createContentSlot(element, getChildren(options));

    let composed!: ComposedLink;
    let onNavigate = options.onNavigate ?? null;

    const handleNavigate = (event: Event): void => {
        onNavigate?.(event, composed);
    };

    const link = createLink(
        element,
        getLinkOptions(options, handleNavigate)
    );

    function setText(text: string): void {
        content.set([text]);
    }

    composed = {
        ...link,
        element,
        setText,

        update(nextOptions: LinkCompositionOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("onNavigate" in nextOptions) {
                onNavigate = nextOptions.onNavigate ?? null;
            }

            link.update(getLinkOptions(nextOptions, handleNavigate));

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

    return composed;
}
