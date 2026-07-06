import { getOwnerWindow } from "../dom";

/**
 * Determines whether a specified HTML element is scrollable.
 * Checks both the computed overflow style properties and the actual scroll boundaries 
 * to ensure content exceeds the visible layout dimensions.
 *
 * @param element - The HTML element to evaluate.
 * @returns True if the element has scrollable overflow styles and overflowing content; otherwise false.
 */
export function isScrollable(element: HTMLElement): boolean {
    const style = getOwnerWindow(element).getComputedStyle(element);
    const overflow = `${style.overflow} ${style.overflowX} ${style.overflowY}`;

    if (!/(auto|scroll|overlay)/.test(overflow)) {
        return false;
    }

    return element.scrollHeight > element.clientHeight ||
           element.scrollWidth > element.clientWidth;
}
