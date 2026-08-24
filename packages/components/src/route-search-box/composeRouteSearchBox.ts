import {
    createAppRouteSearchItems,
    type AppRouteDescriptor,
    type AppRouteSearchItem,
    type AppRouteSearchItemsOptions
} from "../app-routes";
import {
    SearchBox,
    type ComposedSearchBox,
    type SearchBoxOnSelect,
    type SearchBoxOptions,
    type SearchBoxSelectDetail,
    type SearchBoxUpdateOptions
} from "../search-box";

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

/**
 * Creates a route-aware search box from route metadata.
 */
export function RouteSearchBox<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
>(options: RouteSearchBoxOptions<TRoute>): ComposedRouteSearchBox<TRoute> {
    const {
        routes: _routes,
        searchItemsOptions: _searchItemsOptions,
        onSelect: _onSelect,
        onRouteSelect: _onRouteSelect,
        ...searchBoxOptions
    } = options;

    let composed!: ComposedRouteSearchBox<TRoute>;
    let routes = options.routes;
    let searchItemsOptions = options.searchItemsOptions;
    let onSelect = options.onSelect ?? null;
    let onRouteSelect = options.onRouteSelect ?? null;

    function getItems(): RouteSearchBoxItem<TRoute>[] {
        return createAppRouteSearchItems(routes, searchItemsOptions);
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
        items: getItems(),
        onSelect: handleSelect
    });

    const setSearchBoxItems = searchBox.setItems.bind(searchBox);
    const updateSearchBox = searchBox.update.bind(searchBox);

    setRouteSearchBoxAttribute(searchBox);

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
            if ("onSelect" in nextOptions) onSelect = nextOnSelect ?? null;
            if ("onRouteSelect" in nextOptions) onRouteSelect = nextOnRouteSelect ?? null;

            if (nextRoutes !== undefined || "searchItemsOptions" in nextOptions) {
                setSearchBoxItems(getItems());
            }

            updateSearchBox(getSearchBoxUpdateOptions(nextOptions));
            setRouteSearchBoxAttribute(searchBox);
        }
    }) as ComposedRouteSearchBox<TRoute>;

    return composed;
}
