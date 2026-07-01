import { getFocusableElements } from "./getFocusableElements";

/**
 * Moves focus to the first focusable element inside a container.
 *
 * Returns true if focus was moved.
 */
export function focusFirst(
    container: HTMLElement
): boolean {

    const elements = getFocusableElements(container);

    const first = elements[0];

    if (!first) {
        return false;
    }

    first.focus();

    return true;
}