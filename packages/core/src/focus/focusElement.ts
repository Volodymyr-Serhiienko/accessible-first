import { getOwnerDocument } from "../dom";

/**
 * Sets focus to an element.
 *
 * @param element - The HTML element to focus, or null.
 * @param options - Optional focus properties (e.g., preventScroll).
 * @returns True if the element successfully received focus, otherwise false.
 */
export function focusElement(
    element: HTMLElement | null,
    options?: FocusOptions
): boolean {
    if (!element) {
        return false;
    }

    element.focus(options);

    return getOwnerDocument(element).activeElement === element;
}
