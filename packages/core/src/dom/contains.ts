/**
 * Returns true if the container contains the target element.
 * 
 * @param container - The parent element to search within.
 * @param element - The target element to check for existence inside the container.
 * @returns True if the element is found inside the container, otherwise false.
 */
export function contains(container: HTMLElement, element: HTMLElement | null): boolean {
    if (!element) {
        return false;
    }

    return container.contains(element);
}
