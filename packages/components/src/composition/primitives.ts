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
 * Configuration characteristics defining the structural composition options, child rendering arrays,
 * and accessible properties for an un-semantic or flexible container layout.
 */
export interface LayoutPrimitiveOptions extends BaseCompositionOptions {
    children?: CompositionChild[];
    label?: string;
}

/**
 * Configuration behaviors mapping strict document outlines, layout child chains, 
 * and explicit semantic headings to declare a standard content section area.
 */
export interface SectionOptions extends BaseCompositionOptions {
    title: string;
    titleId?: string;
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    children?: CompositionChild[];
}

/**
 * Configuration options specifying a rigid, accessibly sound functional layout toolbar sector.
 * Re-maps structural properties to guarantee explicit identity labeling strings on implementation.
 */
export interface ToolbarOptions extends Omit<LayoutPrimitiveOptions, "label"> {
    label: string;
}

/**
 * Configuration characteristics defining columns, spatial gutters, and sizing patterns 
 * to structure an accessibly sound tabular or flexible layout network.
 */
export interface GridOptions extends LayoutPrimitiveOptions {
    columns?: number | string;
    minColumnWidth?: string;
    gap?: string;
}

/**
 * Configuration options specifying raw, un-sanitized string layouts intended for direct 
 * rendering injection inside the active DOM ecosystem.
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

function isLayoutPrimitiveOptions(value: unknown): value is LayoutPrimitiveOptions {
    if (!value || typeof value !== "object" || "columns" in value
        || "minColumnWidth" in value || "gap" in value) {
        return false;
    }

    if (isNode(value) || isComposedNodeLike(value)) {
        return false;
    }

    return (
        "id" in value
        || "className" in value
        || "attributes" in value
        || "children" in value
        || "label" in value
    );
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
 * Instantiates and coordinates an accessibly structured HTMLSectionElement partition.
 * Enforces proper document outline relationships by pairing dynamic semantic heading fragments 
 * (`h2` through `h6`) with an automatic visual-to-assistive linkage (`aria-labelledby`), 
 * framing structural layout child nodes under predictable identifiers.
 *
 * @param options - Explicit outline weight parameters, title descriptors, configurations, and nested element tokens.
 * @returns A ComposedNode payload wrapping the configured native HTMLSectionElement.
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

export function Panel(...children: CompositionChild[]): ComposedNode;
export function Panel(options: LayoutPrimitiveOptions, ...children: CompositionChild[]): ComposedNode;
/**
 * Generates an isolated generic content presentation surface wrapping child visual sub-trees.
 * 
 * @param args - Polyfill arguments capturing functional base constraints or individual child structural elements.
 * @returns A ComposedNode package framing the configured container element structure.
 */
export function Panel(...args: Array<CompositionChild | LayoutPrimitiveOptions>): ComposedNode {
    const { options, children } = resolveLayoutArgs(args);

    return createComposedElement("div", options, {
        "data-af-composition": "panel"
    }, children);
}

export function Row(...children: CompositionChild[]): ComposedNode;
export function Row(options: LayoutPrimitiveOptions, ...children: CompositionChild[]): ComposedNode;
/**
 * Assembles a structural horizontal layout container row to order internal child view tracks linearly.
 * 
 * @param args - Polyfill parameters mapping functional layout behaviors or isolated element components.
 * @returns A ComposedNode container wrapping the custom horizontal layout node.
 */
export function Row(...args: Array<CompositionChild | LayoutPrimitiveOptions>): ComposedNode {
    const { options, children } = resolveLayoutArgs(args);

    return createComposedElement("div", options, {
        "data-af-layout": "row"
    }, children);
}

export function Stack(...children: CompositionChild[]): ComposedNode;
export function Stack(options: LayoutPrimitiveOptions, ...children: CompositionChild[]): ComposedNode;
/**
 * Assembles a structural vertical layout container to stack internal child view blocks consecutively.
 * 
 * @param args - Polyfill parameters mapping functional layout behaviors or isolated element components.
 * @returns A ComposedNode container wrapping the custom vertical structure node.
 */
export function Stack(...args: Array<CompositionChild | LayoutPrimitiveOptions>): ComposedNode {
    const { options, children } = resolveLayoutArgs(args);

    return createComposedElement("div", options, {
        "data-af-layout": "stack"
    }, children);
}

export function Group(...children: CompositionChild[]): ComposedNode;
export function Group(options: LayoutPrimitiveOptions, ...children: CompositionChild[]): ComposedNode;
/**
 * Groups related control sets or content blocks, conditionally establishing a structural accessibility group role 
 * coupled with non-visual label descriptions when explicit parameters are declared.
 * 
 * @param args - Polyfill parameters tracking distinct group identifiers or inline child blocks.
 * @returns A ComposedNode package framing the semantic group container block.
 */
export function Group(...args: Array<CompositionChild | LayoutPrimitiveOptions>): ComposedNode {
    const { options, children } = resolveLayoutArgs(args);

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
 * Instantiates and coordinates a rigid, accessibly sound workspace toolbar layout container.
 * Configures specific accessibility traits (`role="toolbar"`) and immediate voice navigation labels (`aria-label`) 
 * to unify collections of actionable controls for screen-reader identification.
 * 
 * @param options - Characteristic behavior configurations and explicit labeling tags.
 * @param children - Additional contextual layout items or component nodes mapped inside the toolbar.
 * @returns A ComposedNode package managing the underlying native toolbar container structure.
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
 * Instantiates and coordinates a highly flexible grid layout container surface.
 * Dynamically maps structural columns, responsive scaling thresholds, and spatial gap separation 
 * properties onto isolated CSS custom properties without disrupting structural child flows.
 *
 * @param options - Spatial layout parameters, structural configurations, and initial child arrays.
 * @param children - Supplementary child elements or visual layout items to populate the grid frame.
 * @returns A ComposedNode package managing the configured grid container element.
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
 * Inserts a trusted HTML fragment into a wrapper node.
 *
 * Html intentionally uses innerHTML. Pass only static markup or content that was
 * already sanitized before reaching Accessible First.
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
