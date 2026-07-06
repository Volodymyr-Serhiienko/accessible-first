import { getScrollParent } from "./getScrollParent";

/**
 * Scrolls the container to bring the specified element into view only if it is 
 * currently clipped or hidden outside the container's visible boundaries.
 *
 * @param element - The HTML element to bring into view.
 */
export function scrollIntoViewIfNeeded(element: HTMLElement): void {
    const parent = getScrollParent(element);

    const elementRect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    if (elementRect.top < parentRect.top) {
        parent.scrollTop -= parentRect.top - elementRect.top;
    } else if (elementRect.bottom > parentRect.bottom) {
        parent.scrollTop += elementRect.bottom - parentRect.bottom;
    }

    if (elementRect.left < parentRect.left) {
        parent.scrollLeft -= parentRect.left - elementRect.left;
    } else if (elementRect.right > parentRect.right) {
        parent.scrollLeft += elementRect.right - parentRect.right;
    }
}
