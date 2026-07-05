import { setAriaReferences, type AriaReferences } from "./setAriaReferences";

/**
 * Sets the `aria-labelledby` attribute on a specified element, linking it to the element(s) that label it.
 *
 * @param element - The HTML element that is being labeled.
 * @param labels - A single reference or an array of references (HTMLElements or string IDs) that serve as labels.
 */
export function setAriaLabelledBy(
    element: HTMLElement,
    labels: AriaReferences
): void {
    setAriaReferences(element, "aria-labelledby", labels, "af-label");
}
