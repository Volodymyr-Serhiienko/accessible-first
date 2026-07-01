import { getFocusableElements } from "./getFocusableElements";

/**
 * Moves focus to the last focusable element inside a container.
 *
 * Returns true if focus was moved.
 */
export function focusLast(
    container: HTMLElement
): boolean {

    const elements = getFocusableElements(container);

    const last = elements[elements.length - 1];

    if (!last) {
        return false;
    }

    last.focus();

    return true;
}