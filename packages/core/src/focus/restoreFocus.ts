import { focusElement } from "./focusElement";

/**
 * Restores focus to an element.
 */
export function restoreFocus(element: HTMLElement | null): boolean {
    return focusElement(element);
}
