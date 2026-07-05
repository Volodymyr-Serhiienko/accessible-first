import { getOwnerDocument } from "./getOwnerDocument";

/**
 * Returns the window associated with a node.
 * 
 * @param node - The DOM node to get the owner window from.
 * @returns The window object associated with the node's owner document, falling back to the global window.
 */
export function getOwnerWindow(node: Node): Window {
    return getOwnerDocument(node).defaultView ?? window;
}
