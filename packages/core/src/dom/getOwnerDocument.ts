/**
 * Returns the owner document of a node.
 * 
 * @param node - The DOM node to get the owner document from.
 * @returns The document object that owns the given node, falling back to the global document if none exists.
 */
export function getOwnerDocument(node: Node): Document {
    if (node.ownerDocument) {
        return node.ownerDocument;
    }

    return document;
}
