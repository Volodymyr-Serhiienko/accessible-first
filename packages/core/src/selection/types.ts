/**
 * Selection mode for a collection.
 */
export type SelectionMode = "single" | "multiple";

/**
 * Options for selection updates.
 */
export interface SelectionUpdateOptions {
    notify?: boolean;
}

/**
 * Options for createSelection().
 */
export interface SelectionOptions<TItem> {
    getItems: () => readonly TItem[];
    mode?: SelectionMode;
    defaultSelectedItems?: readonly TItem[];
    isItemDisabled?: (item: TItem) => boolean;
    onSelectionChange?: (selectedItems: TItem[]) => void;
}

/**
 * Headless controller for single or multiple selection state.
 */
export interface Selection<TItem> {
    getSelectedItems(): TItem[];
    setSelectedItems(items: readonly TItem[], options?: SelectionUpdateOptions): void;
    isSelected(item: TItem): boolean;
    selectItem(item: TItem, options?: SelectionUpdateOptions): boolean;
    deselectItem(item: TItem, options?: SelectionUpdateOptions): boolean;
    toggleItem(item: TItem, options?: SelectionUpdateOptions): boolean;
    clearSelection(options?: SelectionUpdateOptions): void;
    refresh(options?: SelectionUpdateOptions): void;
}
