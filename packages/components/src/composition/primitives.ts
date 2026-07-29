import { append } from "./append";
import { createElement } from "./createElement";
import { getCompositionElementOptions } from "./options";
import type {
    BaseCompositionOptions,
    ComposedNode,
    CompositionChild,
    ElementAttributes
} from "./types";

/**
 * Options shared by simple layout primitives.
 */
export interface LayoutPrimitiveOptions extends BaseCompositionOptions {
    children?: CompositionChild[];
}

/**
 * Options for Section().
 */
export interface SectionOptions extends BaseCompositionOptions {
    title: string;
    titleId?: string;
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    children?: CompositionChild[];
}

/**
 * Options for Group().
 */
export interface GroupOptions extends LayoutPrimitiveOptions {
    label?: string;
}

/**
 * Options for Toolbar().
 */
export interface ToolbarOptions extends LayoutPrimitiveOptions {
    label: string;
}

/**
 * Options for Grid().
 */
export interface GridOptions extends LayoutPrimitiveOptions {
    columns?: number | string;
    minColumnWidth?: string;
    gap?: string;
}

/**
 * Options for trusted HTML fragments.
 */
export interface HtmlOptions extends BaseCompositionOptions {
    html: string;
}

let sectionCounter = 0;

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

function isOptionsObject(value: unknown): value is Record<string, unknown> {
    return Boolean(
        value
        && typeof value === "object"
        && !isNode(value)
        && !isComposedNodeLike(value)
    );
}

function hasLayoutOption(value: Record<string, unknown>): boolean {
    return (
        "id" in value
        || "className" in value
        || "attributes" in value
        || "children" in value
    );
}

function isLayoutPrimitiveOptions(value: unknown): value is LayoutPrimitiveOptions {
    return isOptionsObject(value) && hasLayoutOption(value);
}

function isGroupOptions(value: unknown): value is GroupOptions {
    return isOptionsObject(value) && (hasLayoutOption(value) || "label" in value);
}

function resolveLayoutArgs(
    args: Array<CompositionChild | LayoutPrimitiveOptions>
): { options: LayoutPrimitiveOptions; children: CompositionChild[] } {
    const [first, ...rest] = args;

    if (isLayoutPrimitiveOptions(first)) {
        return {
            options: first,
            children: [
                ...(first.children ?? []),
                ...(rest as CompositionChild[])
            ]
        };
    }

    return {
        options: {},
        children: args as CompositionChild[]
    };
}

function resolveGroupArgs(
    args: Array<CompositionChild | GroupOptions>
): { options: GroupOptions; children: CompositionChild[] } {
    const [first, ...rest] = args;

    if (isGroupOptions(first)) {
        return {
            options: first,
            children: [
                ...(first.children ?? []),
                ...(rest as CompositionChild[])
            ]
        };
    }

    return {
        options: {},
        children: args as CompositionChild[]
    };
}

function createComposedElement<KTagName extends keyof HTMLElementTagNameMap>(
    tagName: KTagName,
    options: BaseCompositionOptions = {},
    attributes: ElementAttributes = {},
    children: CompositionChild[] = []
): ComposedNode {
    const element = createElement(
        tagName,
        getCompositionElementOptions(options, attributes, children)
    );

    return { element };
}

function getSectionLabelledBy(options: SectionOptions, titleId: string): string {
    const value = options.attributes?.["aria-labelledby"];

    if (typeof value === "string" && value.trim()) {
        return value;
    }

    return titleId;
}

/**
 * Creates a labelled section with a native heading.
 *
 * The heading is connected to the section with aria-labelledby.
 */
export function Section(options: SectionOptions): ComposedNode {
    const sectionId = options.id ?? `af-section-${++sectionCounter}`;
    const titleId = options.titleId ?? `${sectionId}-title`;
    const headingTag = `h${options.headingLevel ?? 2}` as keyof HTMLElementTagNameMap;

    const heading = createElement(headingTag, {
        id: titleId,
        text: options.title
    });

    const baseOptions: BaseCompositionOptions = {
        id: sectionId
    };

    if (options.className !== undefined) {
        baseOptions.className = options.className;
    }

    if (options.attributes !== undefined) {
        baseOptions.attributes = options.attributes;
    }

    const section = createElement("section", getCompositionElementOptions(
        baseOptions,
        {
            "data-af-composition": "section",
            "aria-labelledby": getSectionLabelledBy(options, titleId)
        }
    ));

    append(section, heading, ...(options.children ?? []));

    return { element: section };
}

/**
 * Creates a framed content panel.
 */
export function Panel(...children: CompositionChild[]): ComposedNode;
export function Panel(options: LayoutPrimitiveOptions, ...children: CompositionChild[]): ComposedNode;
export function Panel(...args: Array<CompositionChild | LayoutPrimitiveOptions>): ComposedNode {
    const { options, children } = resolveLayoutArgs(args);

    return createComposedElement("div", options, {
        "data-af-composition": "panel"
    }, children);
}

/**
 * Creates a horizontal layout that wraps.
 */
export function Row(...children: CompositionChild[]): ComposedNode;
export function Row(options: LayoutPrimitiveOptions, ...children: CompositionChild[]): ComposedNode;
export function Row(...args: Array<CompositionChild | LayoutPrimitiveOptions>): ComposedNode {
    const { options, children } = resolveLayoutArgs(args);

    return createComposedElement("div", options, {
        "data-af-layout": "row"
    }, children);
}

/**
 * Creates a vertical layout.
 */
export function Stack(...children: CompositionChild[]): ComposedNode;
export function Stack(options: LayoutPrimitiveOptions, ...children: CompositionChild[]): ComposedNode;
export function Stack(...args: Array<CompositionChild | LayoutPrimitiveOptions>): ComposedNode {
    const { options, children } = resolveLayoutArgs(args);

    return createComposedElement("div", options, {
        "data-af-layout": "stack"
    }, children);
}

/**
 * Groups related controls or content.
 * Adds role="group" and aria-label when label is provided.
 */
export function Group(...children: CompositionChild[]): ComposedNode;
export function Group(options: GroupOptions, ...children: CompositionChild[]): ComposedNode;
export function Group(...args: Array<CompositionChild | GroupOptions>): ComposedNode {
    const { options, children } = resolveGroupArgs(args);

    const attributes: ElementAttributes = {
        "data-af-layout": "group"
    };

    if (options.label !== undefined) {
        attributes.role = "group";
        attributes["aria-label"] = options.label;
    }

    return createComposedElement("div", options, attributes, children);
}

/**
 * Creates a labelled toolbar for related controls.
 */
export function Toolbar(options: ToolbarOptions, ...children: CompositionChild[]): ComposedNode {
    return createComposedElement("div", options, {
        "data-af-layout": "toolbar",
        role: "toolbar",
        "aria-label": options.label
    }, [
        ...(options.children ?? []),
        ...children
    ]);
}

/**
 * Creates a responsive grid layout.
 *
 * Use minColumnWidth for automatic responsive columns, or columns for an
 * explicit CSS grid-template-columns value.
 */
export function Grid(options: GridOptions, ...children: CompositionChild[]): ComposedNode {
    const node = createComposedElement("div", options, {
        "data-af-layout": "grid"
    }, [
        ...(options.children ?? []),
        ...children
    ]);

    if (options.columns !== undefined) {
        node.element.style.setProperty(
            "--af-grid-columns",
            typeof options.columns === "number"
                ? `repeat(${options.columns}, minmax(0, 1fr))`
                : options.columns
        );
    }

    if (options.minColumnWidth !== undefined) {
        node.element.style.setProperty("--af-grid-min", options.minColumnWidth);
    }

    if (options.gap !== undefined) {
        node.element.style.setProperty("--af-grid-gap", options.gap);
    }

    return node;
}

/**
 * Inserts a trusted HTML fragment.
 *
 * Html intentionally uses innerHTML. Pass only static markup or content that
 * was already sanitized before reaching Accessible First.
 */
export function Html(options: HtmlOptions): ComposedNode {
    const wrapper = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "html"
    }));

    const template = document.createElement("template");
    template.innerHTML = options.html.trim();

    wrapper.append(template.content.cloneNode(true));

    return { element: wrapper };
}
