import { isDisabled, isInert, isVisible } from "../dom";

/**
 * Returns true if the element can receive focus.
 * 
 * @param element - The HTML element to evaluate for focusability.
 * @returns True if the element is not disabled, inert, hidden, and has a valid tabIndex; otherwise false.
 */
export function isFocusable(element: HTMLElement): boolean {
    if (isDisabled(element)) {
        return false;
    }

    if (isInert(element)) {
        return false;
    }

    if (!isVisible(element)) {
        return false;
    }

    if (element.tabIndex < 0) {
        return false;
    }

    return true;
}
