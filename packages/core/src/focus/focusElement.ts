/**
 * Sets focus to an element.
 *
 * Returns true if focus was moved.
 */
export function focusElement(
    element: HTMLElement | null
): boolean {

    if (!element) {
        return false;
    }

    element.focus();

    return true;

}