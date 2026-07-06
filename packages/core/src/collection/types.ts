/**
 * Configuration options for navigating through a collection of items.
 *
 * @template TItem - The type of the items within the collection.
 */
export interface CollectionNavigationOptions<TItem> {
    /**
     * Determines whether navigation should wrap around to the beginning/end 
     * when reaching the boundaries of the collection.
     */
    loop?: boolean;

    /**
     * A callback function to determine if a specific item is disabled and should be skipped during navigation.
     * * @param item - The item to check.
     * @returns True if the item is disabled, otherwise false.
     */
    isItemDisabled?: (item: TItem) => boolean;
}
