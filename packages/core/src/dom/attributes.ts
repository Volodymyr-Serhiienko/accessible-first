/**
 * Restores an attribute value previously captured with getAttribute().
 * A null value means the attribute did not exist and should be removed.
 */
export function restoreAttribute(
    element: Element,
    name: string,
    value: string | null
): void {
    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
}
