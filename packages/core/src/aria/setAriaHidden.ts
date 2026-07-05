import { setAriaAttribute } from "./setAriaAttribute";

/**
 * Sets the `aria-hidden` attribute on a specified element.
 *
 * @param element - The HTML element to modify.
 * @param hidden - A boolean indicating if the element should be hidden from assistive technologies. 
 * If null or undefined, the attribute is removed.
 */
export function setAriaHidden(
    element: HTMLElement,
    hidden: boolean | null | undefined
): void {
    setAriaAttribute(element, "aria-hidden", hidden);
}
