/**
 * Returns true if the value is an HTMLElement.
 */
export function isHTMLElement(
    value: unknown
): value is HTMLElement {

    return value instanceof HTMLElement;

}