import type { Typeahead, TypeaheadOptions } from "./types";

const DEFAULT_TIMEOUT = 700;

function normalizeText(text: string): string {
    return text.trim().toLowerCase();
}

function isTypeaheadKey(event: KeyboardEvent): boolean {
    if (event.altKey || event.ctrlKey || event.metaKey) {
        return false;
    }

    return event.key.length === 1 && event.key.trim() !== "";
}

function getSearchQuery(query: string): string {
    if (query.length <= 1) {
        return query;
    }

    const firstCharacter = query.charAt(0);
    const isRepeatedCharacterQuery = Array.from(query).every(
        (character) => character === firstCharacter
    );

    return isRepeatedCharacterQuery ? firstCharacter : query;
}

/**
 * Creates reusable typeahead behavior for a collection.
 *
 * Typeahead keeps a short-lived character query, searches from the current item,
 * supports repeated-character cycling, and calls onMatch when it finds an item.
 */
export function createTypeahead<TItem>(
    options: TypeaheadOptions<TItem>
): Typeahead<TItem> {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;

    let query = "";
    let resetTimerId: number | null = null;
    let destroyed = false;

    function isItemDisabled(item: TItem): boolean {
        return options.isItemDisabled?.(item) ?? false;
    }

    function clearResetTimer(): void {
        if (resetTimerId === null) {
            return;
        }

        window.clearTimeout(resetTimerId);
        resetTimerId = null;
    }

    function scheduleReset(): void {
        clearResetTimer();

        resetTimerId = window.setTimeout(() => {
            query = "";
            resetTimerId = null;
        }, timeout);
    }

    function getAvailableItems(): TItem[] {
        return options.getItems().filter((item) => !isItemDisabled(item));
    }

    function findMatchingItem(
        searchQuery: string,
        currentItem?: TItem | null
    ): TItem | null {
        const items = getAvailableItems();

        if (items.length === 0) {
            return null;
        }

        const effectiveQuery = getSearchQuery(searchQuery);
        const currentIndex = currentItem ? items.indexOf(currentItem) : -1;
        const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;

        for (let offset = 0; offset < items.length; offset++) {
            const index = (startIndex + offset) % items.length;
            const item = items[index];

            if (item === undefined) {
                continue;
            }

            const text = normalizeText(options.getItemText(item));

            if (text.startsWith(effectiveQuery)) {
                return item;
            }
        }

        return null;
    }

    function search(
        character: string,
        currentItem?: TItem | null
    ): TItem | null {
        if (destroyed) {
            return null;
        }

        const normalizedCharacter = normalizeText(character);

        if (!normalizedCharacter) {
            return null;
        }

        query += normalizedCharacter;

        let match = findMatchingItem(query, currentItem);

        if (!match && query.length > 1) {
            query = normalizedCharacter;
            match = findMatchingItem(query, currentItem);
        }

        scheduleReset();

        if (match) {
            options.onMatch?.(match);
        }

        return match;
    }

    return {
        search,

        handleKey(event: KeyboardEvent, currentItem?: TItem | null): boolean {
            if (!isTypeaheadKey(event)) {
                return false;
            }

            const match = search(event.key, currentItem);

            if (!match) {
                return false;
            }

            event.preventDefault();

            return true;
        },

        reset(): void {
            query = "";
            clearResetTimer();
        },

        getQuery(): string {
            return query;
        },

        destroy(): void {
            destroyed = true;
            query = "";
            clearResetTimer();
        }
    };
}
