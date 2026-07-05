import { contains, getActiveElement } from "../dom";

/**
 * Returns true if the container contains the active element.
 */
export function containsFocus(container: HTMLElement): boolean {
    return contains(
        container,
        getActiveElement(container)
    );
}
