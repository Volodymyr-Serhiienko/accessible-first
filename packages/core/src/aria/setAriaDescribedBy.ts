import { setAriaReferences, type AriaReferences } from "./setAriaReferences";

/**
 * Sets the `aria-describedby` attribute on a specified element, linking it to the element(s) that describe it.
 *
 * @param element - The HTML element that is being described.
 * @param descriptions - A single reference or an array of references (HTMLElements or string IDs) that provide descriptions.
 */
export function setAriaDescribedBy(
    element: HTMLElement,
    descriptions: AriaReferences
): void {
    setAriaReferences(element, "aria-describedby", descriptions, "af-description");
}
