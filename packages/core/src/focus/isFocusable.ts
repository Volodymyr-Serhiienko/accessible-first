/**
 * Returns true if the element can receive focus.
 */
export function isFocusable(
    element: HTMLElement
): boolean {

    if (element.hasAttribute("disabled")) {
        return false;
    }

    if (element.hasAttribute("hidden")) {
        return false;
    }

    if (element.tabIndex < 0) {
        return false;
    }

    return true;

}