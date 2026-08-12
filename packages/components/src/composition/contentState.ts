import { toCompositionChildren } from "./content";
import type { CompositionContent } from "./types";

/**
 * Returns normalized visible text from an element.
 */
export function getElementText(element: HTMLElement, fallback = ""): string {
    const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";

    return text || fallback;
}

/**
 * Checks whether an element currently contains meaningful text.
 */
export function hasVisibleContent(element: HTMLElement): boolean {
    return getElementText(element).length > 0;
}

/**
 * Checks whether composition content contains at least one renderable child.
 */
export function hasCompositionContent(content: CompositionContent | null | undefined): boolean {
    return toCompositionChildren(content).some((child) => (
        child !== null
        && child !== undefined
        && child !== false
    ));
}
