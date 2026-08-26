import type { AppRouteDescriptor } from "../app-routes";
import type { CompositionChild } from "../composition";
import {
    RouteBreadcrumbs,
    type ComposedRouteBreadcrumbs,
    type RouteBreadcrumbsCurrent,
    type RouteBreadcrumbsOptions
} from "../route-breadcrumbs";
import {
    RouteCommandPalette,
    type ComposedRouteCommandPalette,
    type RouteCommandPaletteOptions
} from "../route-command-palette";
import {
    RouteResponsiveNavigation,
    type ComposedRouteResponsiveNavigation,
    type RouteResponsiveNavigationOptions
} from "../route-responsive-navigation";
import {
    RouteSearchBox,
    type ComposedRouteSearchBox,
    type RouteSearchBoxOptions
} from "../route-search-box";

/**
 * Minimal route activation detail shared by route-aware controls.
 */
export interface RouteChromeRouteActivationDetail<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    route: TRoute;
    event?: Event | null;
}

/**
 * Called when any route-aware chrome control activates a route.
 */
export type RouteChromeOnRouteActivate<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = (detail: RouteChromeRouteActivationDetail<TRoute>) => void | boolean;

/**
 * Navigation options owned by createRouteChrome().
 */
export type RouteChromeNavigationOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = Omit<RouteResponsiveNavigationOptions<TRoute>, "routes" | "current" | "onRouteNavigate">;

/**
 * Breadcrumb options owned by createRouteChrome().
 */
export interface RouteChromeBreadcrumbsOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<RouteBreadcrumbsOptions<AppRouteDescriptor>, "routes" | "current"> {
    routes?: readonly AppRouteDescriptor[];
    current?: RouteBreadcrumbsCurrent<TRoute>;
}

/**
 * Search options owned by createRouteChrome().
 */
export type RouteChromeSearchOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = Omit<RouteSearchBoxOptions<TRoute>, "routes" | "onRouteSelect">;

/**
 * Command palette options owned by createRouteChrome().
 */
export type RouteChromeCommandPaletteOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = Omit<RouteCommandPaletteOptions<TRoute>, "routes" | "onRouteSelect">;

/**
 * Navigation-like control returned by createRouteChrome().
 */
export interface RouteChromeNavigationControl {
    setCurrent(match: string | null): void;
}

/**
 * Current-route control returned by createRouteChrome().
 */
export interface RouteChromeCurrentRouteControl<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    setCurrent(current: TRoute | string | null | undefined): void;
}

/**
 * Options for createRouteChrome().
 */
export interface RouteChromeOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    routes: readonly TRoute[];
    current?: TRoute | string | null;
    navigation?: RouteChromeNavigationOptions<TRoute> | false;
    breadcrumbs?: RouteChromeBreadcrumbsOptions<TRoute> | false;
    search?: RouteChromeSearchOptions<TRoute> | false;
    commands?: RouteChromeCommandPaletteOptions<TRoute> | false;
    onRouteActivate?: RouteChromeOnRouteActivate<TRoute> | null;
}

/**
 * Route-aware chrome controls created by createRouteChrome().
 */
export interface RouteChrome<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    readonly navigation: ComposedRouteResponsiveNavigation<TRoute> | null;
    readonly breadcrumbs: ComposedRouteBreadcrumbs<AppRouteDescriptor> | null;
    readonly search: ComposedRouteSearchBox<TRoute> | null;
    readonly commands: ComposedRouteCommandPalette<TRoute> | null;
    readonly headerControls: readonly CompositionChild[];
    readonly navigationControl: RouteChromeNavigationControl | null;
    readonly currentRouteControls: readonly RouteChromeCurrentRouteControl<TRoute>[];
}

type RouteChromeCurrent = AppRouteDescriptor | string | null | undefined;

function getCurrentId(current: RouteChromeCurrent): string | null {
    if (typeof current === "string") return current || null;

    return current?.id ?? null;
}

function getBreadcrumbCurrent<TRoute extends AppRouteDescriptor>(
    current: TRoute | string | null | undefined,
    options: RouteChromeBreadcrumbsOptions<TRoute> | undefined
): RouteBreadcrumbsCurrent<AppRouteDescriptor> {
    if ("current" in (options ?? {})) return options?.current;

    return current;
}

/**
 * Creates the common route-aware chrome controls used by routed app recipes.
 */
export function createRouteChrome<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
>(options: RouteChromeOptions<TRoute>): RouteChrome<TRoute> {
    const routes = [...options.routes];
    const onRouteActivate = options.onRouteActivate ?? null;
    const current = options.current ?? null;
    const currentId = getCurrentId(current);
    const headerControls: CompositionChild[] = [];
    const currentRouteControls: RouteChromeCurrentRouteControl<TRoute>[] = [];

    let navigation: ComposedRouteResponsiveNavigation<TRoute> | null = null;
    let breadcrumbs: ComposedRouteBreadcrumbs<AppRouteDescriptor> | null = null;
    let search: ComposedRouteSearchBox<TRoute> | null = null;
    let commands: ComposedRouteCommandPalette<TRoute> | null = null;

    if (options.navigation !== false) {
        const navigationOptions: RouteResponsiveNavigationOptions<TRoute> = {
            ...(options.navigation ?? {}),
            routes,
            current: currentId
        };

        if (onRouteActivate) navigationOptions.onRouteNavigate = onRouteActivate;

        navigation = RouteResponsiveNavigation<TRoute>(navigationOptions);
    }

    if (options.breadcrumbs !== false) {
        const {
            routes: breadcrumbRoutes,
            current: _current,
            ...breadcrumbOptions
        } = options.breadcrumbs ?? {};

        breadcrumbs = RouteBreadcrumbs<AppRouteDescriptor>({
            ...breadcrumbOptions,
            routes: breadcrumbRoutes ?? routes,
            current: getBreadcrumbCurrent(current, options.breadcrumbs)
        });

        currentRouteControls.push({
            setCurrent(nextCurrent): void {
                breadcrumbs?.setCurrent(nextCurrent);
            }
        });
    }

    if (options.search !== undefined && options.search !== false) {
        const searchOptions: RouteSearchBoxOptions<TRoute> = {
            ...options.search,
            routes
        };

        if (onRouteActivate) searchOptions.onRouteSelect = onRouteActivate;

        search = RouteSearchBox<TRoute>(searchOptions);
        headerControls.push(search);
    }

    if (options.commands !== undefined && options.commands !== false) {
        const commandOptions: RouteCommandPaletteOptions<TRoute> = {
            ...options.commands,
            routes
        };

        if (onRouteActivate) commandOptions.onRouteSelect = onRouteActivate;

        commands = RouteCommandPalette<TRoute>(commandOptions);
        headerControls.push(commands);
    }

    return {
        navigation,
        breadcrumbs,
        search,
        commands,
        headerControls,
        navigationControl: navigation,
        currentRouteControls
    };
}
