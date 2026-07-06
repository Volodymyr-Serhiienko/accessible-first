/**
 * Finds the index of a specific item within an array.
 *
 * @template TItem - The type of elements in the array.
 * @param items - The readonly array of items to search through.
 * @param item - The item to locate in the array.
 * @returns The zero-based index of the item if found, or -1 if the item is null, undefined, or not present.
 */
export function getItemIndex<TItem>(
    items: readonly TItem[],
    item: TItem | null | undefined
): number {
    if (item == null) {
        return -1;
    }

    return items.indexOf(item);
}
