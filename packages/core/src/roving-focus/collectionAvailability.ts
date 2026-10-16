import { isDisabled, isInert, isVisible } from "../dom";

/** Resolves logical disabled state without treating filtering as deselection. */
export function isCollectionItemDisabled(
    item: HTMLElement,
    predicate?: (item: HTMLElement) => boolean
): boolean {
    return predicate?.(item) ?? (isDisabled(item) || item.getAttribute("aria-disabled") === "true");
}

/** Checks actual native focus availability, independently of logical defaults. */
export function canFocusCollectionItem(item: HTMLElement): boolean {
    return item.isConnected && !isDisabled(item) && !isInert(item) && isVisible(item);
}

/**
 * Adds native availability once the collection is rendered. Before mounting or
 * revealing a whole collection, preserve logical defaults without layout tests.
 */
export function isCollectionItemUnavailable(
    container: HTMLElement,
    item: HTMLElement,
    predicate?: (item: HTMLElement) => boolean
): boolean {
    if (isCollectionItemDisabled(item, predicate)) return true;
    if (!container.isConnected || !isVisible(container)) return false;
    return !canFocusCollectionItem(item);
}
