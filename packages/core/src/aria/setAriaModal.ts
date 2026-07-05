import { setAriaAttribute } from "./setAriaAttribute";

/**
 * Sets the `aria-modal` attribute on a specified element.
 *
 * @param element - The HTML element to modify.
 * @param modal - A boolean indicating if the element is a modal window. 
 * If null or undefined, the attribute is removed.
 */
export function setAriaModal(
    element: HTMLElement,
    modal: boolean | null | undefined
): void {
    setAriaAttribute(element, "aria-modal", modal);
}
