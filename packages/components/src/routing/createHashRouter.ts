import type { CompositionContent } from "../composition";
import type { ComposedPageOutlet, PageOutletAnnouncement, PageOutletFocusTarget } from "../page-outlet";

/**
 * Route definition accepted by createHashRouter().
 */
export interface HashRouterRoute {
    id: string;
    title: string;
    render(): CompositionContent;
}

/**
 * Minimal navigation contract used by HashRouter to sync current route state.
 */
export interface HashRouterNavigation {
    setCurrent(match: string | null): void;
}

/**
 * Options for one HashRouter navigation operation.
 */
export interface HashRouterNavigateOptions {
    updateHistory?: boolean;
    replaceHistory?: boolean;
    scroll?: boolean;
    focusTarget?: PageOutletFocusTarget;
    announcement?: PageOutletAnnouncement;
}

/**
 * Options for createHashRouter().
 */
export interface HashRouterOptions<TRoute extends HashRouterRoute> {
    routes: TRoute[];
    outlet: ComposedPageOutlet;
    navigation?: HashRouterNavigation | null;
    defaultRoute?: string | TRoute;
    getDocumentTitle?: ((route: TRoute) => string | null) | null;
    getAnnouncement?: ((route: TRoute, previousRoute: TRoute | null) => PageOutletAnnouncement) | null;
    onRouteChange?: ((route: TRoute, previousRoute: TRoute | null, router: HashRouter<TRoute>) => void) | null;
    inspect?: (() => void) | null;
}

/**
 * Controller returned by createHashRouter().
 */
export interface HashRouter<TRoute extends HashRouterRoute> {
    readonly routes: readonly TRoute[];
    getCurrentRoute(): TRoute;
    getRouteHref(routeOrId: TRoute | string): string;
    getRouteById(id: string | null | undefined): TRoute | null;
    navigate(routeOrId: TRoute | string | null | undefined, options?: HashRouterNavigateOptions): boolean;
    syncFromLocation(options?: HashRouterNavigateOptions): boolean;
    setNavigation(navigation: HashRouterNavigation | null): void;
    start(options?: HashRouterNavigateOptions): void;
    stop(): void;
}

function normalizeRouteId(value: string): string {
    const clean = value.replace(/^#/, "").trim();

    try {
        return decodeURIComponent(clean);
    } catch {
        return clean;
    }
}

function getRouteId(routeOrId: HashRouterRoute | string): string {
    return typeof routeOrId === "string" ? normalizeRouteId(routeOrId) : routeOrId.id;
}

function getFirstRoute<TRoute extends HashRouterRoute>(routes: TRoute[]): TRoute {
    const firstRoute = routes[0];

    if (!firstRoute) {
        throw new Error("createHashRouter requires at least one route.");
    }

    return firstRoute;
}

/**
 * Creates a lightweight hash-based router for PageOutlet screens.
 */
export function createHashRouter<TRoute extends HashRouterRoute>(
    options: HashRouterOptions<TRoute>
): HashRouter<TRoute> {
    const routes = [...options.routes];
    const firstRoute = getFirstRoute(routes);
    const ownerWindow = options.outlet.element.ownerDocument.defaultView ?? window;

    let router!: HashRouter<TRoute>;
    let navigation = options.navigation ?? null;
    let currentRoute: TRoute | null = null;
    let started = false;
    let lastSyncedHash = ownerWindow.location.hash;

    function getRouteById(id: string | null | undefined): TRoute | null {
        if (!id) return null;

        const routeId = normalizeRouteId(id);

        return routes.find((route) => route.id === routeId) ?? null;
    }

    function resolveRoute(routeOrId: TRoute | string | null | undefined): TRoute | null {
        if (!routeOrId) return null;
        if (typeof routeOrId === "string") return getRouteById(routeOrId);

        return getRouteById(routeOrId.id);
    }

    function getDefaultRoute(): TRoute {
        if (options.defaultRoute !== undefined) {
            const route = resolveRoute(options.defaultRoute);

            if (route) return route;
        }

        return firstRoute;
    }

    function getRouteFromLocation(): TRoute {
        return getRouteById(ownerWindow.location.hash) ?? getDefaultRoute();
    }

    const initialRoute = getRouteFromLocation();

    function getCurrentRoute(): TRoute {
        return currentRoute ?? initialRoute;
    }

    function getRouteHref(routeOrId: TRoute | string): string {
        return `#${encodeURIComponent(getRouteId(routeOrId))}`;
    }

    function syncHistory(route: TRoute, navigateOptions: HashRouterNavigateOptions): void {
        const href = getRouteHref(route);

        if (navigateOptions.updateHistory && ownerWindow.location.hash !== href) {
            if (navigateOptions.replaceHistory) {
                ownerWindow.history.replaceState(null, "", href);
            } else {
                ownerWindow.history.pushState(null, "", href);
            }
        }

        lastSyncedHash = ownerWindow.location.hash;
    }

    function syncNavigation(route: TRoute): void {
        navigation?.setCurrent(route.id);
    }

    function focusOutlet(navigateOptions: HashRouterNavigateOptions): void {
        if (navigateOptions.scroll ?? true) {
            options.outlet.element.scrollIntoView({
                block: "start",
                inline: "nearest",
                behavior: "auto"
            });
        }

        if ("focusTarget" in navigateOptions) {
            if (navigateOptions.focusTarget !== null) {
                options.outlet.focus(navigateOptions.focusTarget);
            }

            return;
        }

        options.outlet.focus();
    }

    function navigate(
        routeOrId: TRoute | string | null | undefined,
        navigateOptions: HashRouterNavigateOptions = {}
    ): boolean {
        const route = resolveRoute(routeOrId);

        if (!route) return false;

        const previousRoute = currentRoute;
        const sameRoute = currentRoute !== null && currentRoute.id === route.id;

        syncHistory(route, navigateOptions);
        syncNavigation(route);

        if (sameRoute) {
            focusOutlet(navigateOptions);
            return true;
        }

        currentRoute = route;

        options.outlet.render(route.render(), {
            title: route.title,
            documentTitle: options.getDocumentTitle
                ? options.getDocumentTitle(route)
                : route.title,
            scroll: navigateOptions.scroll ?? true,
            focusTarget: "focusTarget" in navigateOptions
                ? navigateOptions.focusTarget ?? null
                : "first-heading",
            announcement: "announcement" in navigateOptions
                ? navigateOptions.announcement ?? false
                : options.getAnnouncement?.(route, previousRoute) ?? true
        });

        options.inspect?.();
        options.onRouteChange?.(route, previousRoute, router);

        return true;
    }

    function syncFromLocation(navigateOptions: HashRouterNavigateOptions = {}): boolean {
        const hash = ownerWindow.location.hash;

        if (hash === lastSyncedHash && currentRoute !== null) {
            return true;
        }

        lastSyncedHash = hash;

        return navigate(getRouteFromLocation(), {
            ...navigateOptions,
            updateHistory: false
        });
    }

    function handleLocationChange(): void {
        syncFromLocation();
    }

    router = {
        routes,
        getCurrentRoute,
        getRouteHref,
        getRouteById,
        navigate,
        syncFromLocation,

        setNavigation(nextNavigation): void {
            navigation = nextNavigation;
            syncNavigation(getCurrentRoute());
        },

        start(startOptions = {}): void {
            if (started) return;

            started = true;
            ownerWindow.addEventListener("popstate", handleLocationChange);
            ownerWindow.addEventListener("hashchange", handleLocationChange);
            syncFromLocation(startOptions);
        },

        stop(): void {
            if (!started) return;

            started = false;
            ownerWindow.removeEventListener("popstate", handleLocationChange);
            ownerWindow.removeEventListener("hashchange", handleLocationChange);
        }
    };

    return router;
}
