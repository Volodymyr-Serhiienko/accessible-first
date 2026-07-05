/**
 * Returns true if the element has the hidden attribute.
 * 
 * @param element - The HTML element to check for the hidden attribute.
 * @returns True if the element possesses the `hidden` attribute, otherwise false.
 */
export function isHidden(element: HTMLElement): boolean {
    return element.hasAttribute("hidden");
}
