import {
    Combobox,
    type ComboboxCompositionItem,
    type ComboboxCompositionItemUpdate,
    type ComboboxCompositionOptions,
    type ComboboxCompositionUpdateOptions,
    type ComboboxCompositionValueChangeDetail,
    type ComposedCombobox,
    type ComposedComboboxItem
} from "../combobox";
import {
    createElement,
    type BaseCompositionOptions,
    type ComposedNode,
    type ElementAttributes
} from "../composition";
import {
    matchesLocaleSearchText,
    normalizeLocaleSearchText,
    type LocaleSearchLocaleInput,
    type LocaleSearchMatchMode,
    type LocaleSearchMatchOptions
} from "../localization";

/**
 * One searchable item accepted by SearchBox().
 */
export interface SearchBoxItem<TData = unknown> {
    id: string;
    label: string;
    description?: string | null;
    keywords?: string[];
    disabled?: boolean;
    data?: TData;
    optionOptions?: BaseCompositionOptions;
}

/**
 * Partial item update accepted by SearchBox.update({ items }).
 */
export interface SearchBoxItemUpdate {
    label?: string;
    description?: string | null;
    keywords?: string[];
    disabled?: boolean;
    optionOptions?: BaseCompositionOptions;
}

/**
 * Context passed to custom SearchBox item filters.
 */
export interface SearchBoxFilterContext<TItem extends SearchBoxItem = SearchBoxItem> {
    query: string;
    normalizedQuery: string;
    item: TItem;
    searchText: string;
}

/**
 * Custom SearchBox item filter.
 */
export type SearchBoxFilter<TItem extends SearchBoxItem = SearchBoxItem> = (
    context: SearchBoxFilterContext<TItem>
) => boolean;

/**
 * Details passed when the SearchBox query changes.
 */
export interface SearchBoxQueryChangeDetail<TItem extends SearchBoxItem = SearchBoxItem> {
    query: string;
    selectedItem: TItem | null;
    selectedResult: ComposedComboboxItem | null;
    reason: ComboboxCompositionValueChangeDetail["reason"];
    event: Event | null;
}

/**
 * Details passed when a SearchBox result is selected.
 */
export interface SearchBoxSelectDetail<TItem extends SearchBoxItem = SearchBoxItem> {
    item: TItem;
    value: string;
    label: string;
    event: Event | null;
}

/**
 * Called when the SearchBox query changes.
 */
export type SearchBoxOnQueryChange<TItem extends SearchBoxItem = SearchBoxItem> = (
    detail: SearchBoxQueryChangeDetail<TItem>,
    searchBox: ComposedSearchBox<TItem>
) => void;

/**
 * Called when a SearchBox result is selected.
 */
export type SearchBoxOnSelect<TItem extends SearchBoxItem = SearchBoxItem> = (
    detail: SearchBoxSelectDetail<TItem>,
    searchBox: ComposedSearchBox<TItem>
) => void;

/**
 * Options for SearchBox().
 */
export interface SearchBoxOptions<TItem extends SearchBoxItem = SearchBoxItem>
    extends Omit<
        ComboboxCompositionOptions,
        "items" | "value" | "defaultValue" | "filterOption" | "onValueChange"
    > {
    items: TItem[];
    value?: string | null;
    defaultValue?: string | null;
    filterItem?: SearchBoxFilter<TItem> | null;
    searchLocale?: LocaleSearchLocaleInput | null;
    searchMode?: LocaleSearchMatchMode;
    caseSensitive?: boolean;
    ignoreDiacritics?: boolean;
    width?: string | null;
    minWidth?: string | null;
    maxWidth?: string | null;
    onQueryChange?: SearchBoxOnQueryChange<TItem> | null;
    onSelect?: SearchBoxOnSelect<TItem> | null;
}

/**
 * Options accepted by ComposedSearchBox.update().
 */
export interface SearchBoxUpdateOptions<TItem extends SearchBoxItem = SearchBoxItem>
    extends Partial<
        Omit<
            SearchBoxOptions<TItem>,
            "items" | "defaultValue" | "defaultInputValue" | "defaultOpen"
        >
    > {
    items?: SearchBoxItemUpdate[];
}

/**
 * SearchBox created by the composition API.
 */
export interface ComposedSearchBox<TItem extends SearchBoxItem = SearchBoxItem>
    extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly combobox: ComposedCombobox;
    readonly input: HTMLInputElement;
    readonly listbox: HTMLElement;
    getItem(value: string | null | undefined): TItem | null;
    getSelectedItem(): TItem | null;
    getSelectedValue(): string | null;
    setSelectedValue(value: string | null): boolean;
    setItems(items: TItem[]): void;
    update(options: SearchBoxUpdateOptions<TItem>): void;
    destroy(): void;
}

interface SearchBoxItemState<TItem extends SearchBoxItem> {
    item: TItem;
    searchText: string;
}

function getSearchText(item: SearchBoxItem): string {
    return [
        item.label,
        item.description ?? "",
        ...(item.keywords ?? [])
    ].join(" ");
}

function createItemState<TItem extends SearchBoxItem>(item: TItem): SearchBoxItemState<TItem> {
    return {
        item,
        searchText: getSearchText(item)
    };
}

function defaultFilter<TItem extends SearchBoxItem>(
    context: SearchBoxFilterContext<TItem>,
    options: LocaleSearchMatchOptions
): boolean {
    return matchesLocaleSearchText(context.searchText, context.query, options);
}


function createResultContent(item: SearchBoxItem): HTMLElement {
    const children = [
        createElement("span", {
            text: item.label,
            attributes: {
                "data-af-search-box-result-label": ""
            }
        })
    ];

    const description = item.description?.trim();

    if (description) {
        children.push(createElement("span", {
            text: description,
            attributes: {
                "data-af-search-box-result-description": ""
            }
        }));
    }

    return createElement("span", {
        attributes: {
            "data-af-search-box-result": ""
        },
        children
    });
}

function getOptionOptions(item: SearchBoxItem): BaseCompositionOptions {
    const attributes: ElementAttributes = {
        ...(item.optionOptions?.attributes ?? {}),
        "data-af-search-box-option": "",
        "data-af-search-box-result-id": item.id
    };

    const options: BaseCompositionOptions = {
        attributes
    };

    if (item.optionOptions?.id !== undefined) options.id = item.optionOptions.id;
    if (item.optionOptions?.className !== undefined) options.className = item.optionOptions.className;

    return options;
}

function toComboboxItem<TItem extends SearchBoxItem>(
    state: SearchBoxItemState<TItem>
): ComboboxCompositionItem {
    const item = state.item;
    const comboboxItem: ComboboxCompositionItem = {
        value: item.id,
        label: createResultContent(item),
        textValue: item.label,
        optionOptions: getOptionOptions(item)
    };

    if (item.disabled !== undefined) {
        comboboxItem.disabled = item.disabled;
    }

    return comboboxItem;
}

function toComboboxItemUpdate<TItem extends SearchBoxItem>(
    state: SearchBoxItemState<TItem>
): ComboboxCompositionItemUpdate {
    const item = state.item;
    const update: ComboboxCompositionItemUpdate = {
        label: createResultContent(item),
        textValue: item.label,
        optionOptions: getOptionOptions(item)
    };

    if (item.disabled !== undefined) {
        update.disabled = item.disabled;
    }

    return update;
}

function applyItemUpdate<TItem extends SearchBoxItem>(
    item: TItem,
    update: SearchBoxItemUpdate
): TItem {
    const nextItem = { ...item };

    if (update.label !== undefined) nextItem.label = update.label;
    if ("description" in update) nextItem.description = update.description ?? null;
    if (update.keywords !== undefined) nextItem.keywords = update.keywords;
    if (update.disabled !== undefined) nextItem.disabled = update.disabled;
    if (update.optionOptions !== undefined) nextItem.optionOptions = update.optionOptions;

    return nextItem;
}

/**
 * Creates a search-oriented combobox for selecting one result from a known list.
 */
export function SearchBox<TItem extends SearchBoxItem>(
    options: SearchBoxOptions<TItem>
): ComposedSearchBox<TItem> {
    let composed!: ComposedSearchBox<TItem>;
    let itemStates = options.items.map(createItemState);
    let filterItem = options.filterItem ?? null;
    let searchLocale = options.searchLocale ?? null;
    let searchMode = options.searchMode ?? "all-words";
    let caseSensitive = options.caseSensitive ?? false;
    let ignoreDiacritics = options.ignoreDiacritics ?? true;
    let width = options.width ?? null;
    let minWidth = options.minWidth ?? null;
    let maxWidth = options.maxWidth ?? null;
    let onQueryChange = options.onQueryChange ?? null;
    let onSelect = options.onSelect ?? null;

    function getItem(value: string | null | undefined): TItem | null {
        if (!value) return null;

        return itemStates.find((state) => state.item.id === value)?.item ?? null;
    }

    function getItemState(value: string | null | undefined): SearchBoxItemState<TItem> | null {
        if (!value) return null;

        return itemStates.find((state) => state.item.id === value) ?? null;
    }

    function getSearchMatchOptions(): LocaleSearchMatchOptions {
        return {
            locale: searchLocale,
            mode: searchMode,
            caseSensitive,
            ignoreDiacritics
        };
    }

    function filterComboboxOption(context: { inputValue: string; option: HTMLElement }): boolean {
        const state = getItemState(context.option.getAttribute("data-af-search-box-result-id"));

        if (!state) return true;

        const filterContext: SearchBoxFilterContext<TItem> = {
            query: context.inputValue,
            normalizedQuery: normalizeLocaleSearchText(context.inputValue, getSearchMatchOptions()),
            item: state.item,
            searchText: state.searchText
        };

        return filterItem?.(filterContext) ?? defaultFilter(filterContext, getSearchMatchOptions());
    }

    const handleValueChange: NonNullable<ComboboxCompositionOptions["onValueChange"]> = (detail): void => {
        const selectedItem = getItem(detail.value);

        onQueryChange?.(
            {
                query: detail.inputValue,
                selectedItem,
                selectedResult: detail.selectedItem,
                reason: detail.reason,
                event: detail.event
            },
            composed
        );

        if (detail.reason === "selection" && selectedItem) {
            onSelect?.(
                {
                    item: selectedItem,
                    value: selectedItem.id,
                    label: selectedItem.label,
                    event: detail.event
                },
                composed
            );
        }
    };

    function setItems(items: TItem[]): void {
        itemStates = items.map(createItemState);
        combobox.setItems(itemStates.map(toComboboxItem));
        combobox.element.setAttribute("data-af-search-box", "");
    }

    function getInitialComboboxOptions(): ComboboxCompositionOptions {
        const {
            items: _items,
            filterItem: _filterItem,
            searchLocale: _searchLocale,
            searchMode: _searchMode,
            caseSensitive: _caseSensitive,
            ignoreDiacritics: _ignoreDiacritics,
            width: _width,
            minWidth: _minWidth,
            maxWidth: _maxWidth,
            onQueryChange: _onQueryChange,
            onSelect: _onSelect,
            ...comboboxOptions
        } = options;

        const initialOptions: ComboboxCompositionOptions = {
            ...comboboxOptions,
            items: itemStates.map(toComboboxItem),
            filterOption: filterComboboxOption,
            onValueChange: handleValueChange
        };

        if (initialOptions.dismissKeyboardOnSelection === undefined) {
            initialOptions.dismissKeyboardOnSelection = true;
        }

        return initialOptions;
    }

    function getComboboxUpdateOptions(
        nextOptions: SearchBoxUpdateOptions<TItem>
    ): ComboboxCompositionUpdateOptions {
        const {
            items: _items,
            filterItem: _filterItem,
            searchLocale: _searchLocale,
            searchMode: _searchMode,
            caseSensitive: _caseSensitive,
            ignoreDiacritics: _ignoreDiacritics,
            width: _width,
            minWidth: _minWidth,
            maxWidth: _maxWidth,
            onQueryChange: _onQueryChange,
            onSelect: _onSelect,
            ...comboboxOptions
        } = nextOptions;

        return {
            ...comboboxOptions,
            filterOption: filterComboboxOption,
            onValueChange: handleValueChange
        };
    }

    function syncSearchBoxCssVariable(name: string, value: string | null): void {
        if (value === null || !value.trim()) {
            combobox.element.style.removeProperty(name);
            return;
        }

        combobox.element.style.setProperty(name, value);
    }

    function syncSearchBoxSizing(): void {
        syncSearchBoxCssVariable("--af-search-box-width", width);
        syncSearchBoxCssVariable("--af-search-box-min-width", minWidth);
        syncSearchBoxCssVariable("--af-search-box-max-width", maxWidth);
    }

    const combobox = Combobox(getInitialComboboxOptions());

    combobox.element.setAttribute("data-af-search-box", "");
    syncSearchBoxSizing();

    composed = {
        element: combobox.element,
        combobox,
        input: combobox.input,
        listbox: combobox.listbox,
        getItem,

        getSelectedItem(): TItem | null {
            return getItem(combobox.getSelectedValue());
        },

        getSelectedValue(): string | null {
            return combobox.getSelectedValue();
        },

        setSelectedValue(value): boolean {
            return combobox.setSelectedValue(value);
        },

        setItems,

        update(nextOptions): void {
            if ("filterItem" in nextOptions) {
                filterItem = nextOptions.filterItem ?? null;
            }

            if ("searchLocale" in nextOptions) {
                searchLocale = nextOptions.searchLocale ?? null;
            }

            if ("searchMode" in nextOptions) {
                searchMode = nextOptions.searchMode ?? "all-words";
            }

            if ("caseSensitive" in nextOptions) {
                caseSensitive = nextOptions.caseSensitive ?? false;
            }

            if ("ignoreDiacritics" in nextOptions) {
                ignoreDiacritics = nextOptions.ignoreDiacritics ?? true;
            }

            if ("width" in nextOptions) {
                width = nextOptions.width ?? null;
            }

            if ("minWidth" in nextOptions) {
                minWidth = nextOptions.minWidth ?? null;
            }

            if ("maxWidth" in nextOptions) {
                maxWidth = nextOptions.maxWidth ?? null;
            }

            if ("onQueryChange" in nextOptions) {
                onQueryChange = nextOptions.onQueryChange ?? null;
            }

            if ("onSelect" in nextOptions) {
                onSelect = nextOptions.onSelect ?? null;
            }

            const comboboxOptions = getComboboxUpdateOptions(nextOptions);

            if (nextOptions.items !== undefined) {
                itemStates = itemStates.map((state, index) => {
                    const itemUpdate = nextOptions.items?.[index];

                    return itemUpdate === undefined
                        ? state
                        : createItemState(applyItemUpdate(state.item, itemUpdate));
                });

                comboboxOptions.items = itemStates.map(toComboboxItemUpdate);
            }

            combobox.update(comboboxOptions);
            combobox.element.setAttribute("data-af-search-box", "");
            syncSearchBoxSizing();
        },

        destroy(): void {
            combobox.destroy();
        }
    };

    return composed;
}
