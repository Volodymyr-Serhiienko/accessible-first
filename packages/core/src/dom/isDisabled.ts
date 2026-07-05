/**
 * Returns true if the element is natively disabled.
 */
export function isDisabled(element: HTMLElement): boolean {
    return element.matches(":disabled");
}
