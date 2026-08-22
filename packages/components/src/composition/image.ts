import { createElement } from "./createElement";
import { getCompositionElementOptions } from "./options";
import type { BaseCompositionOptions, ComposedNode, ElementAttributes } from "./types";

/**
 * Native image loading mode.
 */
export type ImageLoading = "eager" | "lazy";

/**
 * Native image decoding hint.
 */
export type ImageDecoding = "sync" | "async" | "auto";

/**
 * Native image fetch priority hint.
 */
export type ImageFetchPriority = "high" | "low" | "auto";

/**
 * Object-fit value used for visual image cropping or containment.
 */
export type ImageFit = "contain" | "cover" | "fill" | "none" | "scale-down";

/**
 * Built-in image corner radius token.
 */
export type ImageRadius = "none" | "sm" | "md" | "lg" | "full";

/**
 * Built-in image presentation preset.
 */
export type ImageVariant = "plain" | "rounded" | "thumbnail" | "avatar";

/**
 * Shared options for informative and decorative images.
 */
export interface BaseImageOptions extends BaseCompositionOptions {
    src: string;
    width?: string | number;
    height?: string | number;
    loading?: ImageLoading;
    decoding?: ImageDecoding;
    fetchPriority?: ImageFetchPriority;
    fit?: ImageFit;
    radius?: ImageRadius;
    variant?: ImageVariant;
    aspectRatio?: string | null;
    objectPosition?: string | null;
    inlineSize?: string | null;
    blockSize?: string | null;
}

/**
 * Image options for content images that need meaningful alt text.
 */
export interface InformativeImageOptions extends BaseImageOptions {
    alt: string;
    decorative?: false;
}

/**
 * Image options for decorative images hidden from assistive technologies.
 */
export interface DecorativeImageOptions extends BaseImageOptions {
    alt?: string;
    decorative: true;
}

/**
 * Options for Image() and the Img() alias.
 */
export type ImageOptions = InformativeImageOptions | DecorativeImageOptions;

/**
 * Image created by the composition API.
 */
export interface ComposedImage extends ComposedNode<HTMLImageElement> {
    readonly element: HTMLImageElement;
}

function getImageAlt(options: ImageOptions): string {
    return options.decorative === true ? "" : options.alt;
}

function getImageAttributes(options: ImageOptions): ElementAttributes {
    const attributes: ElementAttributes = {
        "data-af-composition": "image",
        "data-af-image-variant": options.variant ?? "plain",
        src: options.src,
        alt: getImageAlt(options),
        "aria-hidden": options.decorative === true ? true : null
    };

    if (options.width !== undefined) attributes.width = options.width;
    if (options.height !== undefined) attributes.height = options.height;
    if (options.loading !== undefined) attributes.loading = options.loading;
    if (options.decoding !== undefined) attributes.decoding = options.decoding;
    if (options.fetchPriority !== undefined) attributes.fetchpriority = options.fetchPriority;
    if (options.fit !== undefined) attributes["data-af-image-fit"] = options.fit;
    if (options.radius !== undefined) attributes["data-af-image-radius"] = options.radius;
    if (options.aspectRatio !== undefined && options.aspectRatio !== null) attributes["data-af-image-aspect-ratio"] = "";

    return attributes;
}

function setOptionalStyle(
    element: HTMLElement,
    name: string,
    value: string | null | undefined
): void {
    if (value === null || value === undefined || !value.trim()) {
        element.style.removeProperty(name);
        return;
    }

    element.style.setProperty(name, value);
}

function applyImagePresentation(element: HTMLImageElement, options: ImageOptions): void {
    if (options.fit !== undefined) {
        element.style.setProperty("--af-image-fit", options.fit);
    }

    setOptionalStyle(element, "--af-image-aspect-ratio", options.aspectRatio);
    setOptionalStyle(element, "--af-image-object-position", options.objectPosition);
    setOptionalStyle(element, "--af-image-inline-size", options.inlineSize);
    setOptionalStyle(element, "--af-image-block-size", options.blockSize);
}

/**
 * Creates an accessible native image.
 * Informative images require alt text; decorative images intentionally use empty alt text.
 */
export function Image(options: ImageOptions): ComposedImage {
    const element = createElement(
        "img",
        getCompositionElementOptions(options, getImageAttributes(options))
    ) as HTMLImageElement;

    applyImagePresentation(element, options);

    return { element };
}

/**
 * Short alias for Image(). Kept for compact composition code and backwards compatibility.
 */
export function Img(options: ImageOptions): ComposedImage {
    return Image(options);
}
