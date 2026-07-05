import { setAriaReferences, type AriaReference } from "./setAriaReferences";

/**
 * Sets the `aria-controls` attribute on a specified element, linking it to the element(s) it controls.
 *
 * @param element - The HTML element that controls another element.
 * @param controlledElement - The reference (HTMLElement or string ID) to the controlled element.
 */
export function setAriaControls(
    element: HTMLElement,
    controlledElement: AriaReference
): void {
    setAriaReferences(element, "aria-controls", controlledElement, "af-control");
}
