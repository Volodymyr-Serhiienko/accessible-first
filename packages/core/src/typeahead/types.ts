/**
 * Configuration options for initializing a typeahead lookup state machine.
 * Allows type-to-select matching across generic items based on sequential character string buffers.
 *
 * @template TItem - The custom item model type being handled inside the dataset collection.
 */
export interface TypeaheadOptions<TItem> {
    getItems: () => TItem[];
    getItemText: (item: TItem) => string;
    isItemDisabled?: (item: TItem) => boolean;
    timeout?: number;
    onMatch?: (item: TItem) => void;
}

/**
 * Interface representing a managed text typeahead state engine.
 * Accumulates quick character key entries into a localized string buffer to search, match, 
 * and jump focus across custom complex list data types.
 *
 * @template TItem - The custom item model type being handled inside the dataset collection.
 */
export interface Typeahead<TItem> {
    search(character: string, currentItem?: TItem | null): TItem | null;
    handleKey(event: KeyboardEvent, currentItem?: TItem | null): boolean;
    reset(): void;
    getQuery(): string;
    destroy(): void;
}
