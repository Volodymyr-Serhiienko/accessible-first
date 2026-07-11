import { append } from "./append";
import type { CreateElementOptions } from "./types";

function setAttributeValue(
    element: HTMLElement,
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

/**
 * Instantiates and builds a configured, typed native HTMLElement tree branch.
 * Generates an instance corresponding to the designated tag key, binds standard identifying parameters 
 * (`id`, `className`), writes direct string fragments, establishes multi-format attributes, 
 * and sequentially appends complex composition tree structures or child segments.
 *
 * @param tagName - A valid standard HTML element tag token mapping to the target document node type.
 * @param options - Configuration traits defining identifiers, attribute maps, and children.
 * @returns The populated native HTMLElement matching the specified tag token context.
 */
export function createElement<KTagName extends keyof HTMLElementTagNameMap>(
    tagName: KTagName,
    options: CreateElementOptions = {}
): HTMLElementTagNameMap[KTagName] {
    const element = document.createElement(tagName);

    if (options.id !== undefined) {
        element.id = options.id;
    }

    if (options.className !== undefined) {
        element.className = options.className;
    }

    if (options.text !== undefined) {
        element.textContent = options.text;
    }

    if (options.attributes) {
        for (const [name, value] of Object.entries(options.attributes)) {
            setAttributeValue(element, name, value);
        }
    }

    if (options.children) {
        append(element, ...options.children);
    }

    return element;
}
