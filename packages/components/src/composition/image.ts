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
 * Shared options for informative and decorative images.
 */
export interface BaseImageOptions extends BaseCompositionOptions {
    src: string;
    width?: string | number;
    height?: string | number;
    loading?: ImageLoading;
    decoding?: ImageDecoding;
    fetchPriority?: ImageFetchPriority;
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
 * Options for Img().
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
        src: options.src,
        alt: getImageAlt(options),
        "aria-hidden": options.decorative === true ? true : null
    };

    if (options.width !== undefined) attributes.width = options.width;
    if (options.height !== undefined) attributes.height = options.height;
    if (options.loading !== undefined) attributes.loading = options.loading;
    if (options.decoding !== undefined) attributes.decoding = options.decoding;
    if (options.fetchPriority !== undefined) attributes.fetchpriority = options.fetchPriority;

    return attributes;
}

/**
 * Creates an accessible native image.
 *
 * Informative images require alt text. Decorative images intentionally use
 * empty alt text and are hidden from assistive technologies.
 */
export function Img(options: ImageOptions): ComposedImage {
    return {
        element: createElement("img", getCompositionElementOptions(options, getImageAttributes(options)))
    };
}
