import type {
    BaseCompositionOptions,
    CompositionChild,
    CreateElementOptions,
    ElementAttributes
} from "./types";

/**
 * Applies a DOM attribute value using Accessible First conventions.
 * `null`, `undefined`, and `false` remove the attribute; `true` creates a boolean attribute.
 */
export function setElementAttributeValue(
    element: Element,
    name: string,
    value: ElementAttributes[string]
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

/**
 * Applies common composition options to an existing HTMLElement.
 * Useful for composition component update(...) methods.
 */
export function applyCompositionElementOptions(
    element: HTMLElement,
    options: Partial<BaseCompositionOptions> = {}
): void {
    if (options.id !== undefined) {
        element.id = options.id;
    }

    if (options.className !== undefined) {
        element.className = options.className;
    }

    if (options.attributes !== undefined) {
        for (const [name, value] of Object.entries(options.attributes)) {
            setElementAttributeValue(element, name, value);
        }
    }
}
