import { focusElement } from "./focusElement";
import { getFocusableElements } from "./getFocusableElements";

/**
 * Moves focus to the last focusable element inside a container.
 * 
 * @param container - The parent HTML element to search for focusable elements.
 * @returns True if focus was successfully shifted to the last focusable element, otherwise false.
 */
export function focusLast(container: HTMLElement): boolean {
    const elements = getFocusableElements(container);

    return focusElement(
        elements[elements.length - 1] ?? null
    );
}
