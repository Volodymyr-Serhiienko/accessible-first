import {
    getAppRouteById,
    getAppRouteHref,
    getAppRouteParentId,
    type AppRouteBreadcrumbItemsOptions,
    type AppRouteDescriptor,
    type AppRouteNavigationItemsOptions,
    type AppRouteParentIdResolver,
    type AppRouteSearchItemsOptions,
    type AppRouteTrailOptions
} from "../app-routes";
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
 * Synthetic root route prepended to breadcrumb trails by createRouteChrome().
 */
export type RouteChromeBreadcrumbsRoot = AppRouteDescriptor | null;

/**
 * Breadcrumb options owned by createRouteChrome().
 */
export interface RouteChromeBreadcrumbsOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<
        RouteBreadcrumbsOptions<AppRouteDescriptor>,
        "routes" | "current" | "trailOptions" | "breadcrumbItemsOptions"
    > {
    /** Optional route list used only for breadcrumbs, useful for adding synthetic routes. */
    routes?: readonly AppRouteDescriptor[];
    /** Current route override for breadcrumbs. Defaults to the route chrome current route. */
    current?: RouteBreadcrumbsCurrent<TRoute>;
    /** Optional synthetic root route used as the parent for routes without parentId. */
    root?: RouteChromeBreadcrumbsRoot;
    /** Breadcrumb trail options. root augments getParentId unless the resolver returns a value. */
    trailOptions?: AppRouteTrailOptions<AppRouteDescriptor>;
    /** Breadcrumb item resolvers for app routes. Synthetic root routes fall back to their own text. */
    breadcrumbItemsOptions?: AppRouteBreadcrumbItemsOptions<TRoute>;
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
 * Route text defaults used by createRouteChrome() for route-derived control labels, hints, descriptions, and keywords.
 */
export interface RouteChromeRouteTextOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    /** Navigation item resolvers used when navigation does not override them. */
    readonly navigationItemsOptions?: AppRouteNavigationItemsOptions<TRoute>;
    /** Search item resolvers used when search or commands do not override them. */
    readonly searchItemsOptions?: AppRouteSearchItemsOptions<TRoute>;
    /** Breadcrumb item resolvers used when breadcrumbs do not override them. */
    readonly breadcrumbItemsOptions?: AppRouteBreadcrumbItemsOptions<TRoute>;
}

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
    /** Shared route text defaults for navigation, breadcrumbs, search, and commands. */
    routeText?: RouteChromeRouteTextOptions<TRoute> | false;
    /** Route navigation options. Omit to skip navigation in explicit RouteChrome objects. */
    navigation?: RouteChromeNavigationOptions<TRoute> | false;
    /** Route breadcrumbs options. Omit to skip breadcrumbs in explicit RouteChrome objects. */
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

function getBreadcrumbRoutes<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: RouteChromeBreadcrumbsOptions<TRoute> | undefined
): AppRouteDescriptor[] {
    const root = options?.root ?? null;
    const breadcrumbRoutes = [...(options?.routes ?? routes)];

    if (!root || breadcrumbRoutes.some((route) => route.id === root.id)) return breadcrumbRoutes;

    return [root, ...breadcrumbRoutes];
}

function getRootedBreadcrumbParentId(
    route: AppRouteDescriptor,
    root: AppRouteDescriptor,
    getParentId: AppRouteParentIdResolver<AppRouteDescriptor> | undefined
): string | null | undefined {
    if (route.id === root.id) return null;

    const parentId = getParentId?.(route);

    if (parentId !== undefined) return parentId;

    return getAppRouteParentId(route) ?? root.id;
}

function getBreadcrumbTrailOptions<TRoute extends AppRouteDescriptor>(
    options: RouteChromeBreadcrumbsOptions<TRoute> | undefined
): AppRouteTrailOptions<AppRouteDescriptor> | undefined {
    const root = options?.root ?? null;
    const trailOptions = options?.trailOptions;

    if (!root) return trailOptions;

    const nextOptions: AppRouteTrailOptions<AppRouteDescriptor> = {
        ...(trailOptions ?? {})
    };
    const getParentId = trailOptions?.getParentId;

    nextOptions.getParentId = (route) => getRootedBreadcrumbParentId(route, root, getParentId);

    return nextOptions;
}

function getRouteFromBreadcrumbRoute<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    route: AppRouteDescriptor
): TRoute | null {
    return getAppRouteById(routes, route.id);
}

function getTypedBreadcrumbTrail<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    trail: readonly AppRouteDescriptor[]
): TRoute[] {
    return trail
        .map((route) => getRouteFromBreadcrumbRoute(routes, route))
        .filter((route): route is TRoute => route !== null);
}

function createRouteChromeBreadcrumbItemsOptions<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: AppRouteBreadcrumbItemsOptions<TRoute> | undefined
): AppRouteBreadcrumbItemsOptions<AppRouteDescriptor> | undefined {
    if (!options) return undefined;

    const nextOptions: AppRouteBreadcrumbItemsOptions<AppRouteDescriptor> = {};

    if (options.linkCurrent !== undefined) nextOptions.linkCurrent = options.linkCurrent;

    if (options.getLabel) {
        nextOptions.getLabel = (route) => {
            const appRoute = getRouteFromBreadcrumbRoute(routes, route);

            return appRoute ? options.getLabel?.(appRoute) ?? appRoute.title : route.label ?? route.title;
        };
    }

    if (options.getHref) {
        nextOptions.getHref = (route) => {
            const appRoute = getRouteFromBreadcrumbRoute(routes, route);

            return appRoute ? options.getHref?.(appRoute) ?? null : getAppRouteHref(route);
        };
    }

    if (options.getCurrent) {
        nextOptions.getCurrent = (route, index, trail) => {
            const appRoute = getRouteFromBreadcrumbRoute(routes, route);

            if (!appRoute) return undefined;

            const typedTrail = getTypedBreadcrumbTrail(routes, trail);
            const typedIndex = typedTrail.findIndex((trailRoute) => trailRoute.id === appRoute.id);

            return options.getCurrent?.(
                appRoute,
                typedIndex >= 0 ? typedIndex : index,
                typedTrail
            );
        };
    }

    return nextOptions;
}

function mergeRouteChromeItemOptions<TOptions extends object>(
    defaults: TOptions | undefined,
    overrides: TOptions | undefined
): TOptions | undefined {
    if (defaults === undefined) return overrides;
    if (overrides === undefined) return defaults;

    return {
        ...defaults,
        ...overrides
    };
}

function getRouteChromeRouteText<TRoute extends AppRouteDescriptor>(
    options: RouteChromeOptions<TRoute>
): RouteChromeRouteTextOptions<TRoute> | null {
    return options.routeText === false ? null : options.routeText ?? null;
}

function getRouteChromeNavigationItemsOptions<TRoute extends AppRouteDescriptor>(
    routeText: RouteChromeRouteTextOptions<TRoute> | null,
    options: RouteChromeNavigationOptions<TRoute> | undefined
): AppRouteNavigationItemsOptions<TRoute> | undefined {
    return mergeRouteChromeItemOptions(routeText?.navigationItemsOptions, options?.navigationItemsOptions);
}

function getRouteChromeSearchItemsOptions<TRoute extends AppRouteDescriptor>(
    routeText: RouteChromeRouteTextOptions<TRoute> | null,
    options: RouteChromeSearchOptions<TRoute> | RouteChromeCommandPaletteOptions<TRoute> | undefined
): AppRouteSearchItemsOptions<TRoute> | undefined {
    return mergeRouteChromeItemOptions(routeText?.searchItemsOptions, options?.searchItemsOptions);
}

function getRouteChromeBreadcrumbItemsOptions<TRoute extends AppRouteDescriptor>(
    routeText: RouteChromeRouteTextOptions<TRoute> | null,
    options: RouteChromeBreadcrumbsOptions<TRoute> | undefined
): AppRouteBreadcrumbItemsOptions<TRoute> | undefined {
    return mergeRouteChromeItemOptions(routeText?.breadcrumbItemsOptions, options?.breadcrumbItemsOptions);
}

function getRouteChromeSearchLabelOptions<TRoute extends AppRouteDescriptor>(
    options: RouteChromeSearchOptions<TRoute> | undefined
): RouteChromeSearchOptions<TRoute>["labelOptions"] | undefined {
    if (options?.labelOptions !== undefined) return options.labelOptions;

    return {
        attributes: {
            "data-af-composition": "visually-hidden"
        }
    };
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
    const routeText = getRouteChromeRouteText(options);
    const headerControls: CompositionChild[] = [];
    const currentRouteControls: RouteChromeCurrentRouteControl<TRoute>[] = [];

    let navigation: ComposedRouteResponsiveNavigation<TRoute> | null = null;
    let breadcrumbs: ComposedRouteBreadcrumbs<AppRouteDescriptor> | null = null;
    let search: ComposedRouteSearchBox<TRoute> | null = null;
    let commands: ComposedRouteCommandPalette<TRoute> | null = null;

    if (options.navigation !== undefined && options.navigation !== false) {
        const navigationOptions: RouteResponsiveNavigationOptions<TRoute> = {
            ...(options.navigation ?? {}),
            routes,
            current: currentId
        };
        const navigationItemsOptions = getRouteChromeNavigationItemsOptions(routeText, options.navigation);

        if (navigationItemsOptions !== undefined) navigationOptions.navigationItemsOptions = navigationItemsOptions;
        if (onRouteActivate) navigationOptions.onRouteNavigate = onRouteActivate;

        navigation = RouteResponsiveNavigation<TRoute>(navigationOptions);
    }

    if (options.breadcrumbs !== undefined && options.breadcrumbs !== false) {
        const {
            routes: _breadcrumbRoutes,
            current: _current,
            root: _root,
            trailOptions: _trailOptions,
            breadcrumbItemsOptions: _breadcrumbItemsOptions,
            ...breadcrumbOptions
        } = options.breadcrumbs ?? {};
        const routeBreadcrumbsOptions: RouteBreadcrumbsOptions<AppRouteDescriptor> = {
            ...breadcrumbOptions,
            routes: getBreadcrumbRoutes(routes, options.breadcrumbs),
            current: getBreadcrumbCurrent(current, options.breadcrumbs)
        };
        const trailOptions = getBreadcrumbTrailOptions(options.breadcrumbs);
        const breadcrumbItemsOptions = getRouteChromeBreadcrumbItemsOptions(routeText, options.breadcrumbs);
        const routeBreadcrumbItemsOptions = createRouteChromeBreadcrumbItemsOptions(
            routes,
            breadcrumbItemsOptions
        );

        if (trailOptions !== undefined) routeBreadcrumbsOptions.trailOptions = trailOptions;
        if (routeBreadcrumbItemsOptions !== undefined) {
            routeBreadcrumbsOptions.breadcrumbItemsOptions = routeBreadcrumbItemsOptions;
        }

        breadcrumbs = RouteBreadcrumbs<AppRouteDescriptor>(routeBreadcrumbsOptions);

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
        const searchItemsOptions = getRouteChromeSearchItemsOptions(routeText, options.search);

        if (searchItemsOptions !== undefined) searchOptions.searchItemsOptions = searchItemsOptions;

        const labelOptions = getRouteChromeSearchLabelOptions(options.search);

        if (labelOptions !== undefined) searchOptions.labelOptions = labelOptions;
        if (onRouteActivate) searchOptions.onRouteSelect = onRouteActivate;

        search = RouteSearchBox<TRoute>(searchOptions);
        headerControls.push(search);
    }

    if (options.commands !== undefined && options.commands !== false) {
        const commandOptions: RouteCommandPaletteOptions<TRoute> = {
            ...options.commands,
            routes
        };
        const searchItemsOptions = getRouteChromeSearchItemsOptions(routeText, options.commands);

        if (searchItemsOptions !== undefined) commandOptions.searchItemsOptions = searchItemsOptions;
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
