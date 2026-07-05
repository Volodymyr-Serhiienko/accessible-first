import { setAriaAttribute } from "./setAriaAttribute";

/**
 * Sets the `aria-expanded` attribute on a specified element.
 *
 * @param element - The HTML element to modify.
 * @param expanded - A boolean indicating if the element (or the container it controls) is expanded. 
 * If null or undefined, the attribute is removed.
 */
export function setAriaExpanded(
    element: HTMLElement,
    expanded: boolean | null | undefined
): void {
    setAriaAttribute(element, "aria-expanded", expanded);
}
