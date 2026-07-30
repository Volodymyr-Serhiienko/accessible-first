import type {
    Selection,
    SelectionOptions,
    SelectionUpdateOptions
} from "./types";

/**
 * Creates headless selection state for a collection.
 *
 * Selection normalizes selected items against the current collection,
 * skips disabled items, preserves collection order, and emits changes.
 */
export function createSelection<TItem>(
    options: SelectionOptions<TItem>
): Selection<TItem> {
    const mode = options.mode ?? "single";

    let selectedItems = new Set<TItem>();

    function getItems(): readonly TItem[] {
        return options.getItems();
    }

    function isItemDisabled(item: TItem): boolean {
        return options.isItemDisabled?.(item) ?? false;
    }

    function isItemAvailable(item: TItem): boolean {
        return getItems().includes(item) && !isItemDisabled(item);
    }

    function normalizeSelectedItems(items: readonly TItem[]): TItem[] {
        const availableItems = items.filter(isItemAvailable);

        if (mode === "single") {
            const first = availableItems[0];

            return first ? [first] : [];
        }

        const selectedSet = new Set(availableItems);

        return getItems().filter((item) => selectedSet.has(item));
    }

    function getSelectedItems(): TItem[] {
        return getItems().filter((item) => selectedItems.has(item));
    }

    function hasSelectionChanged(nextItems: readonly TItem[]): boolean {
        if (nextItems.length !== selectedItems.size) {
            return true;
        }

        return nextItems.some((item) => !selectedItems.has(item));
    }

    function setSelectedItems(
        items: readonly TItem[],
        updateOptions: SelectionUpdateOptions = {}
    ): void {
        const normalizedItems = normalizeSelectedItems(items);
        const changed = hasSelectionChanged(normalizedItems);

        selectedItems = new Set(normalizedItems);

        if (changed && updateOptions.notify !== false) {
            options.onSelectionChange?.(getSelectedItems());
        }
    }

    function selectItem(
        item: TItem,
        updateOptions: SelectionUpdateOptions = {}
    ): boolean {
        if (!isItemAvailable(item)) {
            return false;
        }

        if (mode === "single") {
            setSelectedItems([item], updateOptions);
            return true;
        }

        if (selectedItems.has(item)) {
            return true;
        }

        setSelectedItems([...getSelectedItems(), item], updateOptions);

        return true;
    }

    function deselectItem(
        item: TItem,
        updateOptions: SelectionUpdateOptions = {}
    ): boolean {
        if (!selectedItems.has(item)) {
            return false;
        }

        setSelectedItems(
            getSelectedItems().filter((selectedItem) => selectedItem !== item),
            updateOptions
        );

        return true;
    }

    function toggleItem(
        item: TItem,
        updateOptions: SelectionUpdateOptions = {}
    ): boolean {
        if (selectedItems.has(item)) {
            return deselectItem(item, updateOptions);
        }

        return selectItem(item, updateOptions);
    }

    selectedItems = new Set(
        normalizeSelectedItems(options.defaultSelectedItems ?? [])
    );

    return {
        getSelectedItems,
        setSelectedItems,

        isSelected(item: TItem): boolean {
            return selectedItems.has(item);
        },

        selectItem,
        deselectItem,
        toggleItem,

        clearSelection(updateOptions: SelectionUpdateOptions = {}): void {
            setSelectedItems([], updateOptions);
        },

        refresh(updateOptions: SelectionUpdateOptions = {}): void {
            setSelectedItems(getSelectedItems(), updateOptions);
        }
    };
}
