import type {
    BaseCompositionOptions,
    CompositionChild,
    CreateElementOptions,
    ElementAttributes
} from "./types";

/**
 * Builds CreateElementOptions from common composition options without emitting
 * undefined optional properties. Extra attributes override base attributes.
 */
export function getCompositionElementOptions(
    options: BaseCompositionOptions = {},
    attributes: ElementAttributes = {},
    children: CompositionChild[] = []
): CreateElementOptions {
    const elementOptions: CreateElementOptions = {};
    const mergedAttributes: ElementAttributes = {
        ...options.attributes,
        ...attributes
    };

    if (options.id !== undefined) {
        elementOptions.id = options.id;
    }

    if (options.className !== undefined) {
        elementOptions.className = options.className;
    }

    if (Object.keys(mergedAttributes).length > 0) {
        elementOptions.attributes = mergedAttributes;
    }

    if (children.length > 0) {
        elementOptions.children = children;
    }

    return elementOptions;
}
