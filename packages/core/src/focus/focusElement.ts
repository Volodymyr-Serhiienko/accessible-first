import { getOwnerDocument } from "../dom";

/**
 * Sets focus to an element.
 *
 * Returns true if focus was moved.
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
