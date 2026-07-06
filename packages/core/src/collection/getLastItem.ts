import { isItemAvailable } from "./isItemAvailable";
import type { CollectionNavigationOptions } from "./types";

/**
 * Retrieves the last available item from a collection by searching backwards.
 *
 * @template TItem - The type of elements in the array.
 * @param items - The readonly array of items to search through.
 * @param options - Navigation options containing the disabling predicate. Defaults to an empty object.
 * @returns The last item that is not disabled, or null if no available item is found or the array is empty.
 */
export function getLastItem<TItem>(
    items: readonly TItem[],
    options: CollectionNavigationOptions<TItem> = {}
): TItem | null {
    for (let index = items.length - 1; index >= 0; index--) {
        const item = items[index];

        if (item !== undefined && isItemAvailable(item, options)) {
            return item;
        }
    }

    return null;
}
