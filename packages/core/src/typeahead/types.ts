/**
 * Options for createTypeahead().
 */
export interface TypeaheadOptions<TItem> {
    getItems: () => TItem[];
    getItemText: (item: TItem) => string;
    isItemDisabled?: (item: TItem) => boolean;
    timeout?: number;
    onMatch?: (item: TItem) => void;
}

/**
 * Controller for character-based collection navigation.
 */
export interface Typeahead<TItem> {
    search(character: string, currentItem?: TItem | null): TItem | null;
    handleKey(event: KeyboardEvent, currentItem?: TItem | null): boolean;
    reset(): void;
    getQuery(): string;
    destroy(): void;
}
