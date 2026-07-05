import { setAriaAttribute } from "./setAriaAttribute";

/**
 * Sets the `aria-disabled` attribute on a specified element.
 *
 * @param element - The HTML element to modify.
 * @param disabled - A boolean indicating if the element is perceivable but inactive. 
 * If null or undefined, the attribute is removed.
 */
export function setAriaDisabled(
    element: HTMLElement,
    disabled: boolean | null | undefined
): void {
    setAriaAttribute(element, "aria-disabled", disabled);
}
