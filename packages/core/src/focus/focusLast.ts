import { getFocusableElements, focusElement } from "../focus";

/**
 * Moves focus to the last focusable element inside a container.
 *
 * Returns true if focus was moved.
 */
export function focusLast(
    container: HTMLElement
): boolean {

    const elements = getFocusableElements(container);

    return focusElement(
        elements[elements.length - 1] ?? null
    );
}