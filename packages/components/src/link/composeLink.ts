import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type CompositionChild
} from "../composition";
import {
    createControlHint,
    type ControlHintDisplay,
    type ControlHintOptions
} from "../foundation";
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
    hint?: string | null;
    hintId?: string;
    hintDisplay?: ControlHintDisplay;
    hintAnnounceOnHover?: boolean;
    onNavigate?: LinkCompositionOnNavigate | null;
}

/**
 * Options accepted by ComposedLink.update().
 */
export interface LinkCompositionUpdateOptions extends Partial<LinkCompositionOptions> {}

/**
 * A link created by Link().
 * Includes the enhanced link behavior plus content and lifecycle helpers.
 */
export interface ComposedLink extends Omit<LinkInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLAnchorElement;
    setText(text: string): void;
    setHint(hint: string | null): void;
    update(options: LinkCompositionUpdateOptions): void;
    destroy(): void;
}

function getControlHintOptions(
    options: LinkCompositionUpdateOptions
): ControlHintOptions {
    const hintOptions: ControlHintOptions = {};

    if ("hint" in options) hintOptions.hint = options.hint ?? null;
    if (options.hintId !== undefined) hintOptions.hintId = options.hintId;
    if (options.hintDisplay !== undefined) hintOptions.hintDisplay = options.hintDisplay;
    if (options.hintAnnounceOnHover !== undefined) {
        hintOptions.hintAnnounceOnHover = options.hintAnnounceOnHover;
    }

    return hintOptions;
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
    options: LinkCompositionUpdateOptions,
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

    const controlHint = createControlHint(element, getControlHintOptions(options));

    function setText(text: string): void {
        content.set([text]);
        controlHint.refresh();
    }

    composed = {
        ...link,
        element,
        setText,
        setHint: controlHint.setHint,

        update(nextOptions: LinkCompositionUpdateOptions): void {
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

            controlHint.update(getControlHintOptions(nextOptions));
            controlHint.refresh();
        },

        destroy(): void {
            content.dispose();
            controlHint.destroy();
            link.destroy();
        }
    };

    return composed;
}
