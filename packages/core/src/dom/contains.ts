/**
 * Returns true if the container contains the target element.
 */
export function contains(container: HTMLElement, element: HTMLElement | null): boolean {
    if (!element) {
        return false;
    }

    return container.contains(element);
}
