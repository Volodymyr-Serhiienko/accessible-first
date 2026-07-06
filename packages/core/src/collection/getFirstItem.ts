import { isItemAvailable } from "./isItemAvailable";
import type { CollectionNavigationOptions } from "./types";

/**
 * Retrieves the first available item from a collection.
 *
 * @template TItem - The type of elements in the array.
 * @param items - The readonly array of items to search through.
 * @param options - Navigation options containing the disabling predicate. Defaults to an empty object.
 * @returns The first item that is not disabled, or null if no available item is found or the array is empty.
 */
export function getFirstItem<TItem>(
    items: readonly TItem[],
    options: CollectionNavigationOptions<TItem> = {}
): TItem | null {
    return items.find((item) => isItemAvailable(item, options)) ?? null;
}
