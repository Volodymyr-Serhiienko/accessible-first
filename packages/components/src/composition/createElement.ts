import { append } from "./append";
import { setElementAttributeValue } from "./options";
import type { CreateElementOptions } from "./types";

/**
 * Creates a typed native HTMLElement and fills it with common composition options.
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
            setElementAttributeValue(element, name, value);
        }
    }

    if (options.children) {
        append(element, ...options.children);
    }

    return element;
}
