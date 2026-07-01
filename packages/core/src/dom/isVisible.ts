import { isHidden } from "./isHidden";

/**
 * Returns true if the element is visible.
 */
export function isVisible(
    element: HTMLElement
): boolean {

    return !isHidden(element);

}