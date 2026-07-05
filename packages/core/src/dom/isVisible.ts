import { getOwnerWindow } from "./getOwnerWindow";
import { isHidden } from "./isHidden";

/**
 * Returns true if the element is considered visible.
 * 
 * @param element - The HTML element to check for visibility.
 * @returns True if the element is not hidden by attributes, CSS display/visibility styles, and occupies layout space; otherwise false.
 */
export function isVisible(element: HTMLElement): boolean {
    if (isHidden(element)) {
        return false;
    }

    const style = getOwnerWindow(element).getComputedStyle(element);

    if (style.display === "none") {
        return false;
    }

    if (style.visibility === "hidden" || style.visibility === "collapse") {
        return false;
    }

    return element.getClientRects().length > 0;
}
