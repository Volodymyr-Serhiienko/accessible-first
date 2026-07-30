/**
 * ARIA attribute name starting with aria-.
 */
export type AriaAttributeName = `aria-${string}`;

/**
 * Value accepted by setAriaAttribute().
 */
export type AriaAttributeValue = string | number | boolean | null | undefined;

/**
 * Sets an ARIA attribute, or removes it when value is null or undefined.
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
