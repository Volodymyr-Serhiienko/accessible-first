import { getOwnerWindow } from "./getOwnerWindow";
import { isHidden } from "./isHidden";

/**
 * Returns true if the element is considered visible.
 * 
 * @param element - The HTML element to check for visibility.
 * @returns True for laid-out content outside hidden/skipped subtrees. Opacity,
 * occlusion and viewport position are deliberately not tested.
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

    if (typeof element.checkVisibility === "function") {
        if (!element.checkVisibility({ visibilityProperty: true })) return false;
    } else {
        // Older engines need explicit skipped-subtree checks; geometry can exist
        // for descendants of a closed details or content-visibility:hidden box.
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
            if (getOwnerWindow(parent).getComputedStyle(parent).contentVisibility === "hidden") return false;
            if (parent.localName === "details" && !parent.hasAttribute("open")) {
                const summary = Array.from(parent.children).find((child) => child.localName === "summary");
                if (!summary?.contains(element)) return false;
            }
        }
    }

    return element.getClientRects().length > 0;
}
