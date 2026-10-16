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
> extends Partial<
        Omit<
            RouteResponsiveNavigationOptions<TRoute>,
            "routes"
        >
    > {
    routes?: readonly TRoute[];
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
    let revision = 0;
    let destroyed = false;

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
        if (destroyed || navigation.isDestroyed()) return;
        const current = revision;
        const route = getRouteFromItem(detail.item);

        onNavigate?.(detail, navigation);

        if (!route || destroyed || navigation.isDestroyed() || current !== revision) return;

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

    const updateNavigation = navigation.update.bind(navigation);
    const setNavigationItems = navigation.setItems.bind(navigation);
    const destroyNavigation = navigation.destroy.bind(navigation);

    setRouteResponsiveNavigationAttribute(navigation);

    composed = Object.assign(navigation, {
        getRoutes(): readonly TRoute[] {
            return routes;
        },

        getRouteFromItem,

        setItems(items: NavigationItem[]): void {
            if (destroyed || navigation.isDestroyed()) return;
            revision += 1;
            setNavigationItems(items);
        },

        setRoutes(nextRoutes: readonly TRoute[]): void {
            composed.update({ routes: nextRoutes });
        },

        update(nextOptions: RouteResponsiveNavigationUpdateOptions<TRoute>): void {
            if (destroyed || navigation.isDestroyed()) return;
            const current = ++revision;
            if (nextOptions.routes !== undefined) routes = nextOptions.routes;
            if ("navigationItemsOptions" in nextOptions) {
                navigationItemsOptions = nextOptions.navigationItemsOptions;
            }
            if ("onNavigate" in nextOptions) onNavigate = nextOptions.onNavigate ?? null;
            if ("onRouteNavigate" in nextOptions) {
                onRouteNavigate = nextOptions.onRouteNavigate ?? null;
            }

            const updateOptions = getResponsiveNavigationUpdateOptions(nextOptions);
            if (destroyed || navigation.isDestroyed() || current !== revision) return;
            updateNavigation(updateOptions);
            if (!destroyed && current === revision) setRouteResponsiveNavigationAttribute(navigation);
        },

        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            revision += 1;
            destroyNavigation();
        }
    }) as ComposedRouteResponsiveNavigation<TRoute>;

    return composed;
}
