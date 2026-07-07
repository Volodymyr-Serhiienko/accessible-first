/**
 * Configuration options for navigating through a collection of items.
 *
 * @template TItem - The type of the items within the collection.
 */
export interface CollectionNavigationOptions<TItem> {
    loop?: boolean;
    isItemDisabled?: (item: TItem) => boolean;
}
