/**
 * Returns true if the element or one of its ancestors is inert.
 */
export function isInert(element: HTMLElement): boolean {
    return element.closest("[inert]") !== null;
}
