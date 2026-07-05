/**
 * Returns true if the value is an HTMLElement.
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
    if (!value || typeof value !== "object") {
        return false;
    }

    const element = value as HTMLElement;
    const ownerWindow = element.ownerDocument?.defaultView;

    if (ownerWindow) {
        return value instanceof ownerWindow.HTMLElement;
    }

    return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}
