import { createOverlayStack } from "./createOverlayStack";
import type { OverlayStack } from "./types";

const stacks = new WeakMap<Document, OverlayStack>();

/**
 * Returns the default overlay stack owned by one browser document.
 */
export function getDocumentOverlayStack(
    ownerDocument: Document
): OverlayStack {
    const existing = stacks.get(ownerDocument);

    if (existing) {
        return existing;
    }

    const stack = createOverlayStack();

    stacks.set(ownerDocument, stack);

    return stack;
}
