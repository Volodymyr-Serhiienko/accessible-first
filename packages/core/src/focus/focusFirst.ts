import { getFocusableElements, focusElement } from "../focus";

/**
 * Moves focus to the first focusable element inside a container.
 *
 * Returns true if focus was moved.
 */
export function focusFirst(
    container: HTMLElement
): boolean {

    const first =
        getFocusableElements(container)[0];

    return focusElement(first ?? null);
}