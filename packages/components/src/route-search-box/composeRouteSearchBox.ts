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
import { createLocaleSubscription } from "../localization/createLocaleSubscription";
import { runCleanups } from "../../../core/src/events";
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
    let destroyed = false;
    let revision = 0;
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
        if (destroyed) return;
        const current = revision;
        onSelect?.(detail, searchBox);
        if (destroyed || current !== revision) return;
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

    const localeSubscription = createLocaleSubscription(() => update({}, true));

    function update(nextOptions: RouteSearchBoxUpdateOptions<TRoute>, refreshItems = false): void {
        if (destroyed) return;
        const current = ++revision;
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
        }
        if ("label" in nextOptions) label = nextOptions.label;
        if ("placeholder" in nextOptions) placeholder = nextOptions.placeholder;
        if ("notFoundText" in nextOptions) notFoundText = nextOptions.notFoundText;
        if ("onSelect" in nextOptions) onSelect = nextOnSelect ?? null;
        if ("onRouteSelect" in nextOptions) onRouteSelect = nextOnRouteSelect ?? null;

        const items = refreshItems || nextRoutes !== undefined || "searchItemsOptions" in nextOptions || "locale" in nextOptions
            ? getItems() : null;
        if (destroyed || current !== revision) return;
        const updateOptions = {
            ...getSearchBoxUpdateOptions(nextOptions),
            ...getSearchBoxTextOptions()
        };
        if (destroyed || current !== revision) return;
        runCleanups([
            () => { if ("locale" in nextOptions) localeSubscription.replace(locale); },
            () => { if (!destroyed && current === revision && items) setSearchBoxItems(items); },
            () => { if (!destroyed && current === revision) updateSearchBox(updateOptions); }
        ]);
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        runCleanups([localeSubscription.destroy, destroySearchBox]);
    }

    composed = Object.assign(searchBox, {
        getRoutes: () => routes,
        getSelectedRoute: () => searchBox.getSelectedItem()?.data ?? null,
        setRoutes: (nextRoutes: readonly TRoute[]) => update({ routes: nextRoutes }),
        update,
        destroy
    }) as ComposedRouteSearchBox<TRoute>;

    setRouteSearchBoxAttribute(searchBox);
    try { localeSubscription.replace(locale); }
    catch (error) {
        try { destroy(); } catch { /* Preserve the construction failure. */ }
        throw error;
    }

    return composed;
}
