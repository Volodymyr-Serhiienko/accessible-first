/**
 * Returns true if the value is an HTMLElement.
 * 
 * @param value - The unknown value to check.
 * @returns True if the value is an instance of HTMLElement (handling cross-realm/iframe checks), otherwise false.
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
    if (!value || typeof value !== "object") {
        return false;
    }

    const element = value as HTMLElement;
    const ownerWindow = element.ownerDocument?.defaultView;

    if (ownerWindow && value instanceof ownerWindow.HTMLElement) return true;
    if (typeof HTMLElement !== "undefined" && value instanceof HTMLElement) return true;

    // Adoption changes ownerDocument, but does not replace the node's original prototype.
    const ElementClass = ownerWindow?.Element ?? (typeof Element !== "undefined" ? Element : null);
    if (!ElementClass) return false;
    try {
        ElementClass.prototype.hasAttribute.call(value, "");
        return element.namespaceURI === "http://www.w3.org/1999/xhtml";
    } catch { return false; }
}
