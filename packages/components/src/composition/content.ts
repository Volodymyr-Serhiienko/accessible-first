import type { CompositionChild, CompositionContent } from "./types";

/**
 * Normalizes optional single-or-array composition content into a children array.
 */
export function toCompositionChildren(
    content: CompositionContent | null | undefined
): CompositionChild[] {
    if (content === null || content === undefined) {
        return [];
    }

    return Array.isArray(content) ? content : [content];
}
