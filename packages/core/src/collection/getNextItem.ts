import { getItemIndex } from "./getItemIndex";
import { isItemAvailable } from "./isItemAvailable";
import type { CollectionNavigationOptions } from "./types";

/**
 * Retrieves the next available item in a collection relative to the current item.
 * Supports wrapping around to the beginning if the `loop` option is enabled.
 *
 * @template TItem - The type of elements in the array.
 * @param items - The readonly array of items to navigate.
 * @param currentItem - The currently active or selected item.
 * @param options - Navigation options containing the loop flag and disabling predicate. Defaults to an empty object.
 * @returns The next available item, the first available item (if looping), or null if no valid item is found.
 */
export function getNextItem<TItem>(
    items: readonly TItem[],
    currentItem: TItem | null | undefined,
    options: CollectionNavigationOptions<TItem> = {}
): TItem | null {
    const currentIndex = getItemIndex(items, currentItem);
    const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;

    for (let index = startIndex; index < items.length; index++) {
        const item = items[index];

        if (item !== undefined && isItemAvailable(item, options)) {
            return item;
        }
    }

    if (options.loop === false) {
        return null;
    }

    for (let index = 0; index < startIndex; index++) {
        const item = items[index];

        if (item !== undefined && isItemAvailable(item, options)) {
            return item;
        }
    }

    return null;
}
