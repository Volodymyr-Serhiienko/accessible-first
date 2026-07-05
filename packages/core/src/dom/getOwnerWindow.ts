import { getOwnerDocument } from "./getOwnerDocument";

/**
 * Returns the window associated with a node.
 */
export function getOwnerWindow(node: Node): Window {
    return getOwnerDocument(node).defaultView ?? window;
}
