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
 * Configuration characteristics defining functional attributes, visual traits, 
 * rendering paths, and accessibility parameters for a structural icon element.
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
 * Encapsulates the assembled DOM node references representing an interactive or descriptive structural vector graphic composition.
 */
export interface ComposedIcon extends ComposedNode {
    readonly element: HTMLSpanElement;
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
 * Assembles an accessible, highly configurable vector graphic icon wrapped within a dedicated inline structural layout element.
 * 
 * @param options - Configuration characteristics specifying coordinate paths, dimension constraints, and explicit accessibility flags.
 * @returns A ComposedIcon package exposing distinct native DOM node tracking references for the outer wrapper span and inner SVG canvas.
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
