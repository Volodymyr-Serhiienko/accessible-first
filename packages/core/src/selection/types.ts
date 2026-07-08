/**
 * Defines the selection constraints for a managed data item collection.
 * - "single": Only one item can be selected at any given time.
 * - "multiple": Multiple items can be checked or toggled simultaneously.
 */
export type SelectionMode = "single" | "multiple";

/**
 * Operational flag variations to fine-tune data state mutation behavior.
 */
export interface SelectionUpdateOptions {
    notify?: boolean;
}

/**
 * Configuration options for creating a headless multi-item selection controller state machine.
 *
 * @template TItem - The data model type of the items tracked inside the collection.
 */
export interface SelectionOptions<TItem> {
    getItems: () => readonly TItem[];
    mode?: SelectionMode;
    defaultSelectedItems?: readonly TItem[];
    isItemDisabled?: (item: TItem) => boolean;
    onSelectionChange?: (selectedItems: TItem[]) => void;
}

/**
 * Interface representing a pure, generic logical selection state engine.
 * Encapsulates single or multi-toggle item matching rules, lookup caching, 
 * event dispatcher side effects, and state verification rules.
 *
 * @template TItem - The data model type of the items tracked inside the collection.
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
