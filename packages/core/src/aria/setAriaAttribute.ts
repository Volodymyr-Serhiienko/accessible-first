export type AriaAttributeName = `aria-${string}`;
export type AriaAttributeValue = string | number | boolean | null | undefined;

/**
 * Sets or removes an ARIA attribute on a specified element based on the provided value.
 *
 * @param element - The HTML element to modify.
 * @param name - The name of the ARIA attribute (must start with "aria-").
 * @param value - The value to assign. If null or undefined, the attribute is removed.
 */
export function setAriaAttribute(
    element: HTMLElement,
    name: AriaAttributeName,
    value: AriaAttributeValue
): void {
    if (value === null || value === undefined) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, String(value));
}
