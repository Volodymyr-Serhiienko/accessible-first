import { contains, getActiveElement } from "../dom";

/**
 * Returns true if the container contains the active element.
 * 
 * @param container - The HTML element to check for focus containment.
 * @returns True if the currently focused element is within the container, otherwise false.
 */
export function containsFocus(container: HTMLElement): boolean {
    return contains(
        container,
        getActiveElement(container)
    );
}
