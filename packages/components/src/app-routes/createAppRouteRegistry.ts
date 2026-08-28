import {
    getAppRouteById,
    getAppRouteByLocation,
    type AppRouteDescriptor,
    type AppRouteLocationMatchOptions
} from "./createAppRouteItems";

/**
 * Route object or route id accepted by app route registry lookup helpers.
 */
export type AppRouteRegistryRouteInput<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = TRoute | string | null | undefined;

/**
 * Options for createAppRouteRegistry().
 */
export interface AppRouteRegistryOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    /** Route descriptors owned by the application. Must contain at least one route. */
    routes: readonly TRoute[];
    /** Default route used when hash/location lookup does not match. Defaults to the first route. */
    defaultRoute?: TRoute | string;
}

/**
 * App-owned route registry with common route lookup and fallback helpers.
 */
export interface AppRouteRegistry<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    /** Stable route descriptors passed to routing, chrome, metadata, diagnostics, and search. */
    readonly routes: readonly TRoute[];
    /** Resolved default route. */
    readonly defaultRoute: TRoute;
    /** Returns the default route. */
    getDefaultRoute(): TRoute;
    /** Finds a route by id, accepting hash-prefixed and encoded ids. */
    getById(id: string | null | undefined): TRoute | null;
    /** Finds a route from a hash string, such as "#settings". */
    getByHash(hash?: string | null): TRoute | null;
    /** Finds a route from a browser location or URL matching options. */
    getByLocation(options?: AppRouteLocationMatchOptions<TRoute>): TRoute | null;
    /** Resolves a route object or id, returning null when it does not exist. */
    resolve(routeOrId: AppRouteRegistryRouteInput<TRoute>): TRoute | null;
    /** Resolves a hash string, falling back to the default route. */
    resolveHash(hash?: string | null): TRoute;
    /** Resolves a route object or id, falling back to the default route. */
    resolveOrDefault(routeOrId: AppRouteRegistryRouteInput<TRoute>): TRoute;
    /** Resolves a route object or id, throwing when it cannot be found. */
    require(routeOrId: AppRouteRegistryRouteInput<TRoute>): TRoute;
}

function getFirstAppRoute<TRoute extends AppRouteDescriptor>(routes: readonly TRoute[]): TRoute {
    const firstRoute = routes[0];

    if (!firstRoute) {
        throw new Error("createAppRouteRegistry requires at least one route.");
    }

    return firstRoute;
}

function getDefaultWindowHash(): string {
    return typeof window === "undefined" ? "" : window.location.hash;
}

function normalizeRouteId(value: string): string {
    const clean = value.replace(/^#/, "").trim();

    try {
        return decodeURIComponent(clean);
    } catch {
        return clean;
    }
}

function getRouteInputId<TRoute extends AppRouteDescriptor>(
    routeOrId: AppRouteRegistryRouteInput<TRoute>
): string | null {
    if (!routeOrId) return null;

    return typeof routeOrId === "string" ? routeOrId : routeOrId.id;
}

/**
 * Creates a small app-owned route registry from one route descriptor list.
 */
export function createAppRouteRegistry<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
>(options: AppRouteRegistryOptions<TRoute>): AppRouteRegistry<TRoute> {
    const routes = [...options.routes];

    function getById(id: string | null | undefined): TRoute | null {
        if (!id) return null;

        return getAppRouteById(routes, normalizeRouteId(id));
    }

    function resolve(routeOrId: AppRouteRegistryRouteInput<TRoute>): TRoute | null {
        return getById(getRouteInputId(routeOrId));
    }

    const defaultRoute = resolve(options.defaultRoute) ?? getFirstAppRoute(routes);

    function resolveOrDefault(routeOrId: AppRouteRegistryRouteInput<TRoute>): TRoute {
        return resolve(routeOrId) ?? defaultRoute;
    }

    return {
        routes,
        defaultRoute,

        getDefaultRoute(): TRoute {
            return defaultRoute;
        },

        getById,

        getByHash(hash = getDefaultWindowHash()): TRoute | null {
            return getById(hash ?? null);
        },

        getByLocation(locationOptions = {}): TRoute | null {
            return getAppRouteByLocation(routes, locationOptions);
        },

        resolve,

        resolveHash(hash = getDefaultWindowHash()): TRoute {
            return getById(hash ?? null) ?? defaultRoute;
        },

        resolveOrDefault,

        require(routeOrId): TRoute {
            const route = resolve(routeOrId);

            if (!route) {
                throw new Error(`Unknown app route: ${String(getRouteInputId(routeOrId) ?? "")}`);
            }

            return route;
        }
    };
}