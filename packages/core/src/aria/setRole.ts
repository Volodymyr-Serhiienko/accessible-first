/**
 * Sets or removes the ARIA role attribute on a specified element.
 *
 * @param element - The HTML element to modify.
 * @param role - The role string to assign. If null, undefined, or an empty string, the attribute is removed.
 */
export function setRole(
    element: HTMLElement,
    role: string | null | undefined
): void {
    if (!role) {
        element.removeAttribute("role");
        return;
    }

    element.setAttribute("role", role);
}
