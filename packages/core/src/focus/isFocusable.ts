import { isDisabled, isInert, isVisible } from "../dom";

/**
 * Returns true if the element can receive focus.
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
