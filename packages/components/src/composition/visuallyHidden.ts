import { createContentSlot } from "./contentSlot";
import { createElement } from "./createElement";
import { getCompositionElementOptions } from "./options";
import type {
    BaseCompositionOptions,
    ComposedNode,
    CompositionChild
} from "./types";

/**
 * Native element used by VisuallyHidden().
 */
export type VisuallyHiddenTagName = "span" | "div";

/**
 * Options for VisuallyHidden().
 */
export interface VisuallyHiddenOptions extends BaseCompositionOptions {
    as?: VisuallyHiddenTagName;
    text?: string;
    children?: CompositionChild[];
}

/**
 * Visually hidden content that remains available to assistive technologies.
 */
export interface ComposedVisuallyHidden extends ComposedNode<HTMLSpanElement | HTMLDivElement> {
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

function getElementOptions(options: VisuallyHiddenOptions) {
    return getCompositionElementOptions(options, {
        "data-af-composition": "visually-hidden"
    });
}

/**
 * Creates content that is visually hidden but still present in the accessibility tree.
 */
export function VisuallyHidden(...children: CompositionChild[]): ComposedVisuallyHidden;
export function VisuallyHidden(
    options: VisuallyHiddenOptions,
    ...children: CompositionChild[]
): ComposedVisuallyHidden;
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
