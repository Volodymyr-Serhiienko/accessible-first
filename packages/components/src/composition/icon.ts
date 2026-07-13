import { createElement } from "./createElement";
import type {
    BaseCompositionOptions,
    ComposedNode,
    CreateElementOptions,
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

function setAttributeValue(
    element: Element,
    name: string,
    value: string | number | boolean | null | undefined
): void {
    if (value === null || value === undefined || value === false) {
        element.removeAttribute(name);
        return;
    }

    if (value === true) {
        element.setAttribute(name, "");
        return;
    }

    element.setAttribute(name, String(value));
}

function getWrapperOptions(options: IconOptions): CreateElementOptions {
    const title = options.title?.trim();
    const attributes: ElementAttributes = {
        ...options.attributes,
        "data-af-composition": "icon"
    };

    if (title && options.decorative !== true) {
        delete attributes["aria-hidden"];
        attributes.role = "img";
        attributes["aria-label"] = title;
    } else {
        delete attributes.role;
        delete attributes["aria-label"];
        attributes["aria-hidden"] = true;
    }

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
        setAttributeValue(svg, name, value);
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
            setAttributeValue(path, name, value);
        }

        svg.append(path);
    }

    element.append(svg);

    return {
        element,
        svg
    };
}
