/**
 * Returns true if the element or one of its ancestors is inert.
 * 
 * @param element - The HTML element to check.
 * @returns True if the element itself or any of its ancestors has the `inert` attribute, otherwise false.
 */
export function isInert(element: HTMLElement): boolean {
    return element.closest("[inert]") !== null;
}
