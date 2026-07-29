import { createElement } from "./createElement";
import {
    getCompositionElementOptions,
    setElementAttributeValue
} from "./options";
import type {
    BaseCompositionOptions,
    ComposedNode,
    ElementAttributes
} from "./types";

/**
 * Options for Icon().
 *
 * Icons are decorative by default when no title, aria-label, or aria-labelledby
 * is provided. Provide title or an accessible name when the icon itself carries meaning.
 */
export interface IconOptions extends BaseCompositionOptions {
    path: string | string[];
    viewBox?: string;
    title?: string;
    decorative?: boolean;
    size?: string;
    svgAttributes?: ElementAttributes;
    pathAttributes?: ElementAttributes;
}

/**
 * SVG icon wrapped in a span for styling and accessibility.
 */
export interface ComposedIcon extends ComposedNode<HTMLSpanElement> {
    readonly svg: SVGSVGElement;
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function hasNonEmptyAttribute(value: ElementAttributes[string]): boolean {
    return typeof value === "string" && value.trim().length > 0;
}

function getWrapperOptions(options: IconOptions) {
    const title = options.title?.trim();
    const hasProvidedName =
        hasNonEmptyAttribute(options.attributes?.["aria-label"])
        || hasNonEmptyAttribute(options.attributes?.["aria-labelledby"]);

    const attributes: ElementAttributes = {
        "data-af-composition": "icon"
    };

    if (options.decorative === true || (!title && !hasProvidedName)) {
        attributes.role = null;
        attributes["aria-label"] = null;
        attributes["aria-labelledby"] = null;
        attributes["aria-hidden"] = true;
    } else {
        attributes.role = "img";
        attributes["aria-hidden"] = null;

        if (title) {
            attributes["aria-label"] = title;
            attributes["aria-labelledby"] = null;
        }
    }

    return getCompositionElementOptions(options, attributes);
}

/**
 * Creates an SVG icon.
 *
 * The inner svg is hidden from assistive technologies; the wrapper exposes
 * the accessible name when the icon is not decorative.
 */
export function Icon(options: IconOptions): ComposedIcon {
    const element = createElement("span", getWrapperOptions(options));
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    const paths = Array.isArray(options.path) ? options.path : [options.path];

    if (options.size !== undefined) {
        element.style.setProperty("--af-icon-size", options.size);
    }

    const svgAttributes: ElementAttributes = {
        ...options.svgAttributes,
        viewBox: options.viewBox ?? "0 0 24 24",
        focusable: false,
        "aria-hidden": true
    };

    for (const [name, value] of Object.entries(svgAttributes)) {
        setElementAttributeValue(svg, name, value);
    }

    for (const pathValue of paths) {
        const d = pathValue.trim();

        if (!d) {
            continue;
        }

        const path = document.createElementNS(SVG_NAMESPACE, "path");
        const pathAttributes: ElementAttributes = {
            fill: "currentColor",
            ...options.pathAttributes,
            d
        };

        for (const [name, value] of Object.entries(pathAttributes)) {
            setElementAttributeValue(path, name, value);
        }

        svg.append(path);
    }

    element.append(svg);

    return {
        element,
        svg
    };
}
