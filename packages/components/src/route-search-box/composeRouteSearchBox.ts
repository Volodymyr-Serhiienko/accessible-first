import {
    createAppRouteSearchItems,
    type AppRouteDescriptor,
    type AppRouteSearchItem,
    type AppRouteSearchItemsOptions
} from "../app-routes";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";
import {
    SearchBox,
    type ComposedSearchBox,
    type SearchBoxOnSelect,
    type SearchBoxOptions,
    type SearchBoxSelectDetail,
    type SearchBoxUpdateOptions
} from "../search-box";

/**
 * Localized message keys used by RouteSearchBox fallback text.
 */
export type RouteSearchBoxMessageKey =
    | "routeSearchBox.label"
    | "routeSearchBox.placeholder"
    | "routeSearchBox.notFoundText";

/**
 * Localization provider accepted by RouteSearchBox.
 */
export type RouteSearchBoxLocalization = LocaleTextProvider<RouteSearchBoxMessageKey>;

/**
 * SearchBox item generated for one route.
 */
export type RouteSearchBoxItem<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = AppRouteSearchItem<TRoute>;

/**
 * Details passed when RouteSearchBox selects a route.
 */
export interface RouteSearchBoxSelectDetail<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends SearchBoxSelectDetail<RouteSearchBoxItem<TRoute>> {
    route: TRoute;
}

/**
 * Called when a route search result is selected.
 */
export type RouteSearchBoxOnRouteSelect<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = (
    detail: RouteSearchBoxSelectDetail<TRoute>,
    searchBox: ComposedRouteSearchBox<TRoute>
) => void;

/**
 * Options for RouteSearchBox().
 */
export interface RouteSearchBoxOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<SearchBoxOptions<RouteSearchBoxItem<TRoute>>, "items" | "onSelect"> {
    routes: readonly TRoute[];
    searchItemsOptions?: AppRouteSearchItemsOptions<TRoute>;
    locale?: RouteSearchBoxLocalization | null;
    onSelect?: SearchBoxOnSelect<RouteSearchBoxItem<TRoute>> | null;
    onRouteSelect?: RouteSearchBoxOnRouteSelect<TRoute> | null;
}

/**
 * Options accepted by ComposedRouteSearchBox.update().
 */
export interface RouteSearchBoxUpdateOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Partial<
        Omit<
            RouteSearchBoxOptions<TRoute>,
            "routes" | "defaultValue" | "defaultInputValue" | "defaultOpen"
        >
    > {
    routes?: readonly TRoute[];
}

/**
 * Route search component derived from application route metadata.
 */
export interface ComposedRouteSearchBox<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<ComposedSearchBox<RouteSearchBoxItem<TRoute>>, "setItems" | "update"> {
    getRoutes(): readonly TRoute[];
    getSelectedRoute(): TRoute | null;
    setRoutes(routes: readonly TRoute[]): void;
    update(options: RouteSearchBoxUpdateOptions<TRoute>): void;
}

function setRouteSearchBoxAttribute(searchBox: ComposedSearchBox): void {
    searchBox.element.setAttribute("data-af-route-search-box", "");
}

function getRouteSearchBoxLocalizedText(
    value: string | null | undefined,
    locale: RouteSearchBoxLocalization | null,
    key: RouteSearchBoxMessageKey
): string | null {
    if (value === null) return null;

    return value ?? getLocaleText(locale, key, accessibleFirstEnglishMessages[key]);
}

/**
 * Creates a route-aware search box from route metadata.
 */
export function RouteSearchBox<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
>(options: RouteSearchBoxOptions<TRoute>): ComposedRouteSearchBox<TRoute> {
    const {
        routes: _routes,
        searchItemsOptions: _searchItemsOptions,
        locale: _locale,
        label: _label,
        placeholder: _placeholder,
        notFoundText: _notFoundText,
        onSelect: _onSelect,
        onRouteSelect: _onRouteSelect,
        ...searchBoxOptions
    } = options;

    let composed!: ComposedRouteSearchBox<TRoute>;
    let routes = options.routes;
    let searchItemsOptions = options.searchItemsOptions;
    let locale: RouteSearchBoxLocalization | null = options.locale ?? null;
    let label = options.label;
    let placeholder = options.placeholder;
    let notFoundText = options.notFoundText;
    let unsubscribeLocale: (() => void) | null = null;
    let onSelect = options.onSelect ?? null;
    let onRouteSelect = options.onRouteSelect ?? null;

    function getItems(): RouteSearchBoxItem<TRoute>[] {
        return createAppRouteSearchItems(routes, searchItemsOptions);
    }

    function getSearchBoxTextOptions(): Pick<
        SearchBoxOptions<RouteSearchBoxItem<TRoute>>,
        "label" | "placeholder" | "notFoundText"
    > {
        return {
            label: getRouteSearchBoxLocalizedText(label, locale, "routeSearchBox.label"),
            placeholder: getRouteSearchBoxLocalizedText(placeholder, locale, "routeSearchBox.placeholder"),
            notFoundText: getRouteSearchBoxLocalizedText(notFoundText, locale, "routeSearchBox.notFoundText")
        };
    }

    const handleSelect: SearchBoxOnSelect<RouteSearchBoxItem<TRoute>> = (detail, searchBox): void => {
        onSelect?.(detail, searchBox);

        onRouteSelect?.(
            {
                ...detail,
                route: detail.item.data
            },
            composed
        );
    };

    function getSearchBoxUpdateOptions(
        nextOptions: RouteSearchBoxUpdateOptions<TRoute>
    ): SearchBoxUpdateOptions<RouteSearchBoxItem<TRoute>> {
        const {
            routes: _nextRoutes,
            searchItemsOptions: _nextSearchItemsOptions,
            locale: _nextLocale,
            label: _nextLabel,
            placeholder: _nextPlaceholder,
            notFoundText: _nextNotFoundText,
            onSelect: _nextOnSelect,
            onRouteSelect: _nextOnRouteSelect,
            ...nextSearchBoxOptions
        } = nextOptions;

        return {
            ...nextSearchBoxOptions,
            onSelect: handleSelect
        };
    }

    const searchBox = SearchBox<RouteSearchBoxItem<TRoute>>({
        ...searchBoxOptions,
        ...getSearchBoxTextOptions(),
        items: getItems(),
        onSelect: handleSelect
    });

    const setSearchBoxItems = searchBox.setItems.bind(searchBox);
    const updateSearchBox = searchBox.update.bind(searchBox);
    const destroySearchBox = searchBox.destroy.bind(searchBox);

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        if (!locale?.subscribe) return;

        unsubscribeLocale = locale.subscribe(() => {
            setSearchBoxItems(getItems());
            updateSearchBox(getSearchBoxTextOptions());
        });
    }

    setRouteSearchBoxAttribute(searchBox);
    syncLocaleSubscription();

    composed = Object.assign(searchBox, {
        getRoutes(): readonly TRoute[] {
            return routes;
        },

        getSelectedRoute(): TRoute | null {
            return searchBox.getSelectedItem()?.data ?? null;
        },

        setRoutes(nextRoutes: readonly TRoute[]): void {
            routes = nextRoutes;
            setSearchBoxItems(getItems());
            setRouteSearchBoxAttribute(searchBox);
        },

        update(nextOptions: RouteSearchBoxUpdateOptions<TRoute>): void {
            const {
                routes: nextRoutes,
                searchItemsOptions: nextSearchItemsOptions,
                onSelect: nextOnSelect,
                onRouteSelect: nextOnRouteSelect
            } = nextOptions;

            if (nextRoutes !== undefined) routes = nextRoutes;
            if ("searchItemsOptions" in nextOptions) searchItemsOptions = nextSearchItemsOptions;
            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                syncLocaleSubscription();
            }
            if ("label" in nextOptions) label = nextOptions.label;
            if ("placeholder" in nextOptions) placeholder = nextOptions.placeholder;
            if ("notFoundText" in nextOptions) notFoundText = nextOptions.notFoundText;
            if ("onSelect" in nextOptions) onSelect = nextOnSelect ?? null;
            if ("onRouteSelect" in nextOptions) onRouteSelect = nextOnRouteSelect ?? null;

            if (nextRoutes !== undefined || "searchItemsOptions" in nextOptions || "locale" in nextOptions) {
                setSearchBoxItems(getItems());
            }

            updateSearchBox({
                ...getSearchBoxUpdateOptions(nextOptions),
                ...getSearchBoxTextOptions()
            });
            setRouteSearchBoxAttribute(searchBox);
        },

        destroy(): void {
            unsubscribeLocale?.();
            destroySearchBox();
        }
    }) as ComposedRouteSearchBox<TRoute>;

    return composed;
}
