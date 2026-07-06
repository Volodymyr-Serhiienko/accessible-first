import type { CollectionNavigationOptions } from "./types";

/**
 * Checks if a specific item is available for navigation based on the provided options.
 *
 * @template TItem - The type of the item.
 * @param item - The item to check.
 * @param options - Navigation options, including the disabling predicate. Defaults to an empty object.
 * @returns True if the item is not disabled, otherwise false.
 */
export function isItemAvailable<TItem>(
    item: TItem,
    options: CollectionNavigationOptions<TItem> = {}
): boolean {
    return !options.isItemDisabled?.(item);
}
