/**
 * Returns true if the element is natively disabled.
 * 
 * @param element - The HTML element to check for the disabled state.
 * @returns True if the element matches the native `:disabled` pseudo-class, otherwise false.
 */
export function isDisabled(element: HTMLElement): boolean {
    return element.matches(":disabled");
}
