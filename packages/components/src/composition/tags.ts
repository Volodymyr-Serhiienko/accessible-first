import { createElement } from "./createElement";
import type {
    BaseCompositionOptions,
    ComposedNode,
    CompositionChild,
    CreateElementOptions
} from "./types";

/**
 * Configuration characteristics defining functional attributes, visual traits, 
 * explicit text payloads, and structural child layout tracks to render a label Tag block.
 */
export interface TagOptions extends BaseCompositionOptions {
    text?: string;
    children?: CompositionChild[];
}

function isTagOptions(value: unknown): value is TagOptions {
    return Boolean(
        value
        && typeof value === "object"
        && !(value instanceof Node)
        && !("element" in value)
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
            children: [...(first.children ?? []), ...(rest as CompositionChild[])]
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
    const elementOptions: CreateElementOptions = {};

    if (options.id !== undefined) elementOptions.id = options.id;
    if (options.className !== undefined) elementOptions.className = options.className;
    if (options.attributes !== undefined) elementOptions.attributes = options.attributes;
    if (options.text !== undefined && children.length === 0) elementOptions.text = options.text;
    if (children.length > 0) elementOptions.children = children;

    return {
        element: createElement(tagName, elementOptions)
    };
}

/**
 * Assembles a standard structural block container wrapper to arrange nested child elements or layout tracks.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured div element structure.
 */
export function Div(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("div", args);
}

/**
 * Assembles an inline text or layout presentation wrapper to organize structural child fragments.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured span element structure.
 */
export function Span(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("span", args);
}

/**
 * Assembles a standard structural paragraph text block container to organize typographic child fragments.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured paragraph element structure.
 */
export function P(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("p", args);
}

/**
 * Assembles a top-level primary page heading structural container block to define the main document outline title.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured h1 heading element structure.
 */
export function H1(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("h1", args);
}

/**
 * Assembles a secondary level section heading structural container block to establish major document outline regions.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured h2 heading element structure.
 */
export function H2(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("h2", args);
}

/**
 * Assembles a third-level sub-section heading structural container block to establish detailed document outline sub-regions.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured h3 heading element structure.
 */
export function H3(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("h3", args);
}

/**
 * Assembles a standard unordered list container block to organize sequential, bulleted collection child items.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured unordered list element structure.
 */
export function Ul(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("ul", args);
}

/**
 * Assembles a standard ordered list container block to organize sequential, numbered collection child items.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured ordered list element structure.
 */
export function Ol(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("ol", args);
}

/**
 * Assembles a standard structural list item block to represent a distinct entry within an ordered or unordered list container.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured list item element structure.
 */
export function Li(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("li", args);
}

/**
 * Assembles an inline strong emphasis structural wrapper to indicate critical importance or urgency for textual child fragments.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured strong element structure.
 */
export function Strong(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("strong", args);
}

/**
 * Assembles an inline emphasis structural wrapper to apply stressed linguistic inflection to textual child fragments.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured emphasis element structure.
 */
export function Em(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("em", args);
}

/**
 * Assembles an inline small text structural wrapper to represent side-comments, legal disclaimers, or small print.
 * 
 * @param args - Polyfill arguments capturing functional base constraints, layout descriptors, or individual child nodes.
 * @returns A ComposedNode package framing the configured small element structure.
 */
export function Small(...args: Array<CompositionChild | TagOptions>): ComposedNode {
    return tag("small", args);
}
