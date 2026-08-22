import { createElement } from "./createElement";
import {
    getCompositionElementOptions,
    setElementAttributeValue
} from "./options";
import type { ImageDecoding, ImageFetchPriority, ImageLoading } from "./image";
import type {
    BaseCompositionOptions,
    ComposedNode,
    ElementAttributes
} from "./types";

/**
 * SVG path data accepted by Icon().
 */
export type IconPathData = string | readonly string[];

/**
 * Visual drawing mode for inline SVG path icons.
 */
export type IconVariant = "solid" | "outline";

/**
 * Shared options for path-based and file-based icons.
 * Icons are decorative by default unless title, alt, aria-label, or aria-labelledby is provided.
 */
export interface BaseIconOptions extends BaseCompositionOptions {
    title?: string;
    decorative?: boolean;
    size?: string;
}

/**
 * Options for inline SVG path icons.
 * Use this when the icon should inherit current text color through currentColor.
 */
export interface IconPathOptions extends BaseIconOptions {
    path: IconPathData;
    variant?: IconVariant;
    strokeWidth?: string | number;
    viewBox?: string;
    svgAttributes?: ElementAttributes;
    pathAttributes?: ElementAttributes;
    src?: never;
}

/**
 * Options for file-based icons such as external SVG, PNG, or WebP assets.
 * Use this when the icon already exists as an asset file.
 */
export interface IconImageOptions extends BaseIconOptions {
    src: string;
    alt?: string;
    width?: string | number;
    height?: string | number;
    loading?: ImageLoading;
    decoding?: ImageDecoding;
    fetchPriority?: ImageFetchPriority;
    imageAttributes?: ElementAttributes;
    path?: never;
}

/**
 * Options for Icon().
 */
export type IconOptions = IconPathOptions | IconImageOptions;

/**
 * Icon created by the composition API.
 */
export interface ComposedIcon extends ComposedNode<HTMLSpanElement> {
    readonly svg: SVGSVGElement | null;
    readonly image: HTMLImageElement | null;
}

/**
 * Icon created from inline SVG path data.
 */
export interface ComposedSvgIcon extends ComposedIcon {
    readonly svg: SVGSVGElement;
    readonly image: null;
}

/**
 * Icon created from an image asset file.
 */
export interface ComposedImageIcon extends ComposedIcon {
    readonly svg: null;
    readonly image: HTMLImageElement;
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function hasNonEmptyAttribute(value: ElementAttributes[string]): boolean {
    return typeof value === "string" && value.trim().length > 0;
}

function isPathIconOptions(options: IconOptions): options is IconPathOptions {
    return "path" in options;
}

function getIconLabel(options: IconOptions): string | null {
    const title = options.title?.trim();

    if (title) {
        return title;
    }

    if (!isPathIconOptions(options)) {
        const alt = options.alt?.trim();

        if (alt) {
            return alt;
        }
    }

    return null;
}

function getWrapperOptions(options: IconOptions) {
    const label = getIconLabel(options);
    const hasProvidedName =
        hasNonEmptyAttribute(options.attributes?.["aria-label"])
        || hasNonEmptyAttribute(options.attributes?.["aria-labelledby"]);

    const attributes: ElementAttributes = {
        "data-af-composition": "icon"
    };

    if (options.decorative === true || (!label && !hasProvidedName)) {
        attributes.role = null;
        attributes["aria-label"] = null;
        attributes["aria-labelledby"] = null;
        attributes["aria-hidden"] = true;
    } else {
        attributes.role = "img";
        attributes["aria-hidden"] = null;

        if (label && !hasProvidedName) {
            attributes["aria-label"] = label;
            attributes["aria-labelledby"] = null;
        }
    }

    return getCompositionElementOptions(options, attributes);
}

function getDefaultPathAttributes(options: IconPathOptions): ElementAttributes {
    if (options.variant === "outline") {
        return {
            fill: "none",
            stroke: "currentColor",
            "stroke-width": options.strokeWidth ?? 2,
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
        };
    }

    return {
        fill: "currentColor"
    };
}

function createSvgIcon(options: IconPathOptions): SVGSVGElement {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    const paths = Array.isArray(options.path) ? options.path : [options.path];

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
            ...getDefaultPathAttributes(options),
            ...options.pathAttributes,
            d
        };

        for (const [name, value] of Object.entries(pathAttributes)) {
            setElementAttributeValue(path, name, value);
        }

        svg.append(path);
    }

    return svg;
}

function createImageIcon(options: IconImageOptions): HTMLImageElement {
    const image = document.createElement("img");
    const imageAttributes: ElementAttributes = {
        ...options.imageAttributes,
        src: options.src,
        alt: "",
        "aria-hidden": true,
        draggable: "false"
    };

    if (options.width !== undefined) imageAttributes.width = options.width;
    if (options.height !== undefined) imageAttributes.height = options.height;
    if (options.loading !== undefined) imageAttributes.loading = options.loading;
    if (options.decoding !== undefined) imageAttributes.decoding = options.decoding;
    if (options.fetchPriority !== undefined) imageAttributes.fetchpriority = options.fetchPriority;

    for (const [name, value] of Object.entries(imageAttributes)) {
        setElementAttributeValue(image, name, value);
    }

    return image;
}

/**
 * Creates an icon from inline SVG path data.
 */
export function Icon(options: IconPathOptions): ComposedSvgIcon;

/**
 * Creates an icon from an external image asset.
 */
export function Icon(options: IconImageOptions): ComposedImageIcon;

/**
 * Creates an icon from path or asset options.
 */
export function Icon(options: IconOptions): ComposedIcon;

/**
 * Creates an accessible icon wrapper.
 * The inner svg or image is hidden from assistive technologies; the wrapper exposes
 * the accessible name only when the icon itself carries meaning.
 */
export function Icon(options: IconOptions): ComposedIcon {
    const element = createElement("span", getWrapperOptions(options));

    if (options.size !== undefined) {
        element.style.setProperty("--af-icon-size", options.size);
    }

    if (isPathIconOptions(options)) {
        const svg = createSvgIcon(options);

        element.append(svg);

        return {
            element,
            svg,
            image: null
        };
    }

    const image = createImageIcon(options);

    element.append(image);

    return {
        element,
        svg: null,
        image
    };
}
