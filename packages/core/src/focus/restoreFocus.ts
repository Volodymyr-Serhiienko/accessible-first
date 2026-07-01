import { focusElement } from "../focus";

/**
 * Restores focus to an element.
 */
export function restoreFocus(
    element: HTMLElement | null
): boolean {

    if (!element) {
        return false;
    }

    return focusElement(element);
}