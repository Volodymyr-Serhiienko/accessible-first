/**
 * Returns the owner document of a node.
 */
export function getOwnerDocument(node: Node): Document {
    if (node.ownerDocument) {
        return node.ownerDocument;
    }

    return document;
}
