/**
 * Restores focus to an element.
 */
export function restoreFocus(
    element: HTMLElement | null
): boolean {

    if (!element) {
        return false;
    }

    element.focus();

    return true;
}