import { getFocusableElements } from "./getFocusableElements";

/**
 * Returns true if the container contains focusable elements.
 * 
 * @param container - The parent HTML element to check for focusable descendants.
 * @returns True if at least one focusable element is found within the container, otherwise false.
 */
export function hasFocusableElements(container: HTMLElement): boolean {
    return getFocusableElements(container).length > 0;
}
