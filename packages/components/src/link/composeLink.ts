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
 * Called when the composed link is activated.
 * Receives the native event and the composed link instance.
 */
export type LinkCompositionOnNavigate = (
    event: Event,
    link: ComposedLink
) => void;

/**
 * Options for Link(), the composition API that creates and enhances a native anchor.
 * Use `text` for simple labels or `children` for richer content.
 */
export interface LinkCompositionOptions
    extends Omit<LinkOptions, "onNavigate">,
        BaseCompositionOptions {
    text?: string;
    children?: CompositionChild[];
    onNavigate?: LinkCompositionOnNavigate | null;
}

/**
 * A link created by Link().
 * Includes the enhanced link behavior plus content and lifecycle helpers.
 */
export interface ComposedLink extends Omit<LinkInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLAnchorElement;
    setText(text: string): void;
    update(options: Partial<LinkCompositionOptions>): void;
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
    options: Partial<LinkCompositionOptions>,
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
 * Creates an accessible link with default styling hooks and optional composed content.
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

        update(nextOptions: Partial<LinkCompositionOptions>): void {
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
