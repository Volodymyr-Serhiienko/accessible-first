import {
    createAppRouteNavigationItems,
    getAppRouteById,
    type AppRouteDescriptor,
    type AppRouteNavigationItemsOptions
} from "../app-routes";
import {
    type NavigationItem,
    type NavigationNavigateDetail
} from "../navigation";
import {
    ResponsiveNavigation,
    type ComposedResponsiveNavigation,
    type ResponsiveNavigationOnNavigate,
    type ResponsiveNavigationOptions,
    type ResponsiveNavigationUpdateOptions
} from "../responsive-navigation";

/**
 * Details passed when RouteResponsiveNavigation activates a route.
 */
export interface RouteResponsiveNavigationNavigateDetail<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends NavigationNavigateDetail {
    route: TRoute;
}

/**
 * Called when a route navigation item is activated.
 */
export type RouteResponsiveNavigationOnRouteNavigate<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = (
    detail: RouteResponsiveNavigationNavigateDetail<TRoute>,
    navigation: ComposedRouteResponsiveNavigation<TRoute>
) => void;

/**
 * Options for RouteResponsiveNavigation().
 */
export interface RouteResponsiveNavigationOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<ResponsiveNavigationOptions, "items"> {
    routes: readonly TRoute[];
    navigationItemsOptions?: AppRouteNavigationItemsOptions<TRoute>;
    onRouteNavigate?: RouteResponsiveNavigationOnRouteNavigate<TRoute> | null;
}

/**
 * Options accepted by ComposedRouteResponsiveNavigation.update().
 */
export interface RouteResponsiveNavigationUpdateOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends ResponsiveNavigationUpdateOptions {
    routes?: readonly TRoute[];
    navigationItemsOptions?: AppRouteNavigationItemsOptions<TRoute>;
    onRouteNavigate?: RouteResponsiveNavigationOnRouteNavigate<TRoute> | null;
}

/**
 * Responsive navigation component derived from application route metadata.
 */
export interface ComposedRouteResponsiveNavigation<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends ComposedResponsiveNavigation {
    getRoutes(): readonly TRoute[];
    getRouteFromItem(item: NavigationItem): TRoute | null;
    setRoutes(routes: readonly TRoute[]): void;
    update(options: RouteResponsiveNavigationUpdateOptions<TRoute>): void;
}

function getHashRouteId(href: string | null | undefined): string | null {
    if (!href?.startsWith("#")) return null;

    const value = href.slice(1);

    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function setRouteResponsiveNavigationAttribute(
    navigation: ComposedResponsiveNavigation
): void {
    navigation.element.setAttribute("data-af-route-responsive-navigation", "");
}

/**
 * Creates responsive navigation from route metadata.
 */
export function RouteResponsiveNavigation<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
>(
    options: RouteResponsiveNavigationOptions<TRoute>
): ComposedRouteResponsiveNavigation<TRoute> {
    const {
        routes: _routes,
        navigationItemsOptions: _navigationItemsOptions,
        onNavigate: _onNavigate,
        onRouteNavigate: _onRouteNavigate,
        ...responsiveOptions
    } = options;

    let composed!: ComposedRouteResponsiveNavigation<TRoute>;
    let routes = options.routes;
    let navigationItemsOptions = options.navigationItemsOptions;
    let onNavigate: ResponsiveNavigationOnNavigate | null = options.onNavigate ?? null;
    let onRouteNavigate = options.onRouteNavigate ?? null;

    function getItems(): NavigationItem[] {
        return createAppRouteNavigationItems(routes, navigationItemsOptions);
    }

    function getRouteFromItem(item: NavigationItem): TRoute | null {
        if (item.id) {
            return getAppRouteById(routes, item.id);
        }

        return getAppRouteById(routes, getHashRouteId(item.href));
    }

    const handleNavigate: ResponsiveNavigationOnNavigate = (detail, navigation): void => {
        const route = getRouteFromItem(detail.item);

        onNavigate?.(detail, navigation);

        if (!route) return;

        onRouteNavigate?.(
            {
                ...detail,
                route
            },
            composed
        );
    };

    function getResponsiveNavigationUpdateOptions(
        nextOptions: RouteResponsiveNavigationUpdateOptions<TRoute>
    ): ResponsiveNavigationUpdateOptions {
        const {
            routes: _nextRoutes,
            navigationItemsOptions: _nextNavigationItemsOptions,
            onRouteNavigate: _nextOnRouteNavigate,
            ...nextResponsiveOptions
        } = nextOptions;

        const updateOptions: ResponsiveNavigationUpdateOptions = {
            ...nextResponsiveOptions,
            onNavigate: handleNavigate
        };

        if (nextOptions.routes !== undefined || "navigationItemsOptions" in nextOptions) {
            updateOptions.items = getItems();
        }

        return updateOptions;
    }

    const navigation = ResponsiveNavigation({
        ...responsiveOptions,
        items: getItems(),
        onNavigate: handleNavigate
    });

    setRouteResponsiveNavigationAttribute(navigation);

    composed = Object.assign(navigation, {
        getRoutes(): readonly TRoute[] {
            return routes;
        },

        getRouteFromItem,

        setRoutes(nextRoutes: readonly TRoute[]): void {
            routes = nextRoutes;
            navigation.setItems(getItems());
            setRouteResponsiveNavigationAttribute(navigation);
        },

        update(nextOptions: RouteResponsiveNavigationUpdateOptions<TRoute>): void {
            if (nextOptions.routes !== undefined) routes = nextOptions.routes;
            if ("navigationItemsOptions" in nextOptions) {
                navigationItemsOptions = nextOptions.navigationItemsOptions;
            }
            if ("onNavigate" in nextOptions) onNavigate = nextOptions.onNavigate ?? null;
            if ("onRouteNavigate" in nextOptions) {
                onRouteNavigate = nextOptions.onRouteNavigate ?? null;
            }

            navigation.update(getResponsiveNavigationUpdateOptions(nextOptions));
            setRouteResponsiveNavigationAttribute(navigation);
        }
    }) as ComposedRouteResponsiveNavigation<TRoute>;

    return composed;
}
