import { createId } from "./createId";

/**
 * Ensures that the given element has an `id`.
 * Returns the existing `id` or generates and assigns a new one if it's missing.
 *
 * @param element - The HTML element to ensure an `id` for.
 * @param prefix - Prefix used when generating a new `id`.
 * @returns The element's `id`.
 */
export function ensureId(
    element: HTMLElement,
    prefix = "af"
): string {
    if (element.id) {
        return element.id;
    }

    element.id = createId(prefix);

    return element.id;
}
