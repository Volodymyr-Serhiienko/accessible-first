import { focusElement } from "./focusElement";

/**
 * Restores focus to an element.
 * 
 * @param element - The HTML element to restore focus to, or null.
 * @returns True if focus was successfully restored to the element, otherwise false.
 */
export function restoreFocus(element: HTMLElement | null): boolean {
    return focusElement(element);
}
