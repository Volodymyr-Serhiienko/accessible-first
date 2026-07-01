import { getOwnerDocument } from "./getOwnerDocument";

/**
 * Returns the owner window of an element.
 */
export function getOwnerWindow(
    element: Node
): Window {

    return getOwnerDocument(element).defaultView ?? window;

}