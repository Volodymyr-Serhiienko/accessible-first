import { createElement } from "./createElement";
import { getCompositionElementOptions } from "./options";
import type {
    BaseCompositionOptions,
    ComposedNode,
    CompositionChild
} from "./types";

/**
 * Options shared by native tag helpers such as P(), H1(), Ul(), and Li().
 */
export interface TagOptions extends BaseCompositionOptions {
    text?: string;
    children?: CompositionChild[];
}

function isNode(value: unknown): value is Node {
    return typeof Node !== "undefined" && value instanceof Node;
}

function isComposedNodeLike(value: unknown): value is ComposedNode {
    return Boolean(value && typeof value === "object" && "element" in value);
}

function isTagOptions(value: unknown): value is TagOptions {
    return Boolean(
        value
        && typeof value === "object"
        && !isNode(value)
        && !isComposedNodeLike(value)
        && (
            "id" in value
            || "className" in value
            || "attributes" in value
            || "text" in value
            || "children" in value
        )
    );
}

function resolveArgs(args: Array<CompositionChild | TagOptions>): {
    options: TagOptions;
    children: CompositionChild[];
} {
    const [first, ...rest] = args;

    if (isTagOptions(first)) {
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

function tag<KTagName extends keyof HTMLElementTagNameMap>(
    tagName: KTagName,
    args: Array<CompositionChild | TagOptions>
): ComposedNode {
    const { options, children } = resolveArgs(args);
    const elementOptions = getCompositionElementOptions(options, {}, children);

    return {
        element: createElement(tagName, elementOptions)
    };
}

/** Creates a div element. */
export function Div(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("div", args);
}

/** Creates a span element. */
export function Span(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("span", args);
}

/** Creates a paragraph element. */
export function P(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("p", args);
}

/** Creates an h1 heading. */
export function H1(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("h1", args);
}

/** Creates an h2 heading. */
export function H2(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("h2", args);
}

/** Creates an h3 heading. */
export function H3(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("h3", args);
}

/** Creates an unordered list. */
export function Ul(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("ul", args);
}

/** Creates an ordered list. */
export function Ol(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("ol", args);
}

/** Creates a list item. */
export function Li(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("li", args);
}

/** Creates a strong text element. */
export function Strong(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("strong", args);
}

/** Creates an emphasized text element. */
export function Em(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("em", args);
}

/** Creates a small text element. */
export function Small(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("small", args);
}
