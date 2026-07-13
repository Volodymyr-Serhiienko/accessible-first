import { createContentSlot } from "./contentSlot";
import { createElement } from "./createElement";
import type {
    BaseCompositionOptions,
    ComposedNode,
    CompositionChild,
    CreateElementOptions,
    ElementAttributes
} from "./types";

/**
 * Permitted structural HTML container tags used to frame visually hidden accessible content.
 */
export type VisuallyHiddenTagName = "span" | "div";

/**
 * Configuration characteristics defining the root node element type, initial textual contents,
 * or nested composition nodes for an accessible screen-reader-only utility container.
 */
export interface VisuallyHiddenOptions extends BaseCompositionOptions {
    as?: VisuallyHiddenTagName;
    text?: string;
    children?: CompositionChild[];
}

/**
 * Encapsulates the assembled DOM node references and state modifiers managing a visually hidden,
 * screen-reader accessible interface block.
 */
export interface ComposedVisuallyHidden extends ComposedNode {
    readonly element: HTMLSpanElement | HTMLDivElement;
    setText(text: string): void;
    setChildren(children: CompositionChild[]): void;
    destroy(): void;
}

function isNode(value: unknown): value is Node {
    return typeof Node !== "undefined" && value instanceof Node;
}

function isComposedNodeLike(value: unknown): value is ComposedNode {
    return Boolean(
        value
        && typeof value === "object"
        && "element" in value
    );
}

function isVisuallyHiddenOptions(value: unknown): value is VisuallyHiddenOptions {
    if (!value || typeof value !== "object") {
        return false;
    }

    if (isNode(value) || isComposedNodeLike(value)) {
        return false;
    }

    return (
        "id" in value
        || "className" in value
        || "attributes" in value
        || "as" in value
        || "text" in value
        || "children" in value
    );
}

function resolveArgs(args: Array<CompositionChild | VisuallyHiddenOptions>): {
    options: VisuallyHiddenOptions;
    children: CompositionChild[];
} {
    const [first, ...rest] = args;

    if (isVisuallyHiddenOptions(first)) {
        return {
            options: first,
            children: [
                ...(first.children ?? (first.text !== undefined ? [first.text] : [])),
                ...(rest as CompositionChild[])
            ]
        };
    }

    return {
        options: {},
        children: args as CompositionChild[]
    };
}

function getElementOptions(options: VisuallyHiddenOptions): CreateElementOptions {
    const attributes: ElementAttributes = {
        ...options.attributes,
        "data-af-composition": "visually-hidden"
    };

    const elementOptions: CreateElementOptions = {
        attributes
    };

    if (options.id !== undefined) {
        elementOptions.id = options.id;
    }

    if (options.className !== undefined) {
        elementOptions.className = options.className;
    }

    return elementOptions;
}

export function VisuallyHidden(...children: CompositionChild[]): ComposedVisuallyHidden;
export function VisuallyHidden(
    options: VisuallyHiddenOptions,
    ...children: CompositionChild[]
): ComposedVisuallyHidden;

/**
 * Assembles a screen-reader-accessible structural layout container that hides text or child elements visually while preserving them in the assistive technology tree.
 * 
 * @param args - Flexible arguments capturing either configuration options followed by child variants, or a flat collection of child fragments.
 * @returns A ComposedVisuallyHidden package exposing state modifiers to dynamically alter text content, update inner child trees, or handle teardown.
 */
export function VisuallyHidden(
    ...args: Array<CompositionChild | VisuallyHiddenOptions>
): ComposedVisuallyHidden {
    const { options, children } = resolveArgs(args);
    const element = createElement(options.as ?? "span", getElementOptions(options));
    const content = createContentSlot(element, children);

    function setText(text: string): void {
        content.set([text]);
    }

    function setChildren(nextChildren: CompositionChild[]): void {
        content.set(nextChildren);
    }

    return {
        element,
        setText,
        setChildren,
        destroy(): void {
            content.dispose();
        }
    };
}
