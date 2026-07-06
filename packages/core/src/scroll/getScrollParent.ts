import { getOwnerDocument } from "../dom";
import { isScrollable } from "./isScrollable";

/**
 * Traverses up the DOM tree to find the nearest scrollable ancestor of an element.
 * Falls back to the document root element if no scrollable container is found.
 *
 * @param element - The HTML element whose scroll parent needs to be located.
 * @returns The nearest scrollable ancestor HTMLElement, or the document root element.
 */
export function getScrollParent(element: HTMLElement): HTMLElement {
    let parent = element.parentElement;

    while (parent) {
        if (isScrollable(parent)) {
            return parent;
        }

        parent = parent.parentElement;
    }

    return getOwnerDocument(element).documentElement;
}
