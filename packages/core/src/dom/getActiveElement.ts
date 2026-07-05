import { getOwnerDocument } from "./getOwnerDocument";
import { isHTMLElement } from "./isHTMLElement";

/**
 * Returns the currently focused element for a given node.
 * 
 * @param node - The DOM node used to determine the owner document.
 * @returns The currently active HTMLElement, or null if there is none or it's not an HTMLElement.
 */
export function getActiveElement(node: Node): HTMLElement | null {
    const activeElement = getOwnerDocument(node).activeElement;

    return isHTMLElement(activeElement) ? activeElement : null;
}
