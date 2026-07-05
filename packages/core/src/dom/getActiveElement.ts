import { getOwnerDocument } from "./getOwnerDocument";
import { isHTMLElement } from "./isHTMLElement";

/**
 * Returns the currently focused element for a given node.
 */
export function getActiveElement(node: Node): HTMLElement | null {
    const activeElement = getOwnerDocument(node).activeElement;

    return isHTMLElement(activeElement) ? activeElement : null;
}
