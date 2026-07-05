import { focusElement } from "./focusElement";
import { getFocusableElements } from "./getFocusableElements";

/**
 * Moves focus to the first focusable element inside a container.
 * 
 * @param container - The parent HTML element to search for focusable elements.
 * @returns True if focus was successfully shifted to the first focusable element, otherwise false.
 */
export function focusFirst(container: HTMLElement): boolean {
    const first = getFocusableElements(container)[0];

    return focusElement(first ?? null);
}
