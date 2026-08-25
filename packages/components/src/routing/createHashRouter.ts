import type { CompositionContent } from "../composition";
import type { DocumentMetadataUpdateOptions } from "../document-metadata";
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
 * Options for re-rendering the current HashRouter route without changing location.
 */
export interface HashRouterRefreshOptions extends HashRouterNavigateOptions {
    notify?: boolean;
}

/**
 * Route activation detail accepted by activateHashRouterRoute().
 */
export interface HashRouterRouteActivationDetail<TRoute extends HashRouterRoute> {
    route: TRoute;
    event?: Event | null;
}

/**
 * Options for activateHashRouterRoute().
 */
export interface HashRouterRouteActivationOptions extends HashRouterNavigateOptions {
    preventDefault?: boolean;
}

/**
 * Called after HashRouter changes the active route.
 */
export type HashRouterRouteChangeHandler<TRoute extends HashRouterRoute> = (
    route: TRoute,
    previousRoute: TRoute | null,
    router: HashRouter<TRoute>
) => void;

/**
 * Removes a previously registered HashRouter listener.
 */
export type HashRouterUnsubscribe = () => void;

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
    onRouteChange?: HashRouterRouteChangeHandler<TRoute> | null;
    /**
     * Resolves document metadata for the active route.
     */
    getDocumentMetadata?: ((route: TRoute, previousRoute: TRoute | null) => DocumentMetadataUpdateOptions | null | undefined) | null;
    /**
     * Applies metadata returned by getDocumentMetadata().
     */
    updateDocumentMetadata?: ((metadata: DocumentMetadataUpdateOptions) => void) | null;
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
    refresh(options?: HashRouterRefreshOptions): boolean;
    syncFromLocation(options?: HashRouterNavigateOptions): boolean;
    setNavigation(navigation: HashRouterNavigation | null): void;
    subscribe(handler: HashRouterRouteChangeHandler<TRoute>): HashRouterUnsubscribe;
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
 * Activates a HashRouter route from route-aware component events.
 */
export function activateHashRouterRoute<TRoute extends HashRouterRoute>(
    router: HashRouter<TRoute>,
    detail: HashRouterRouteActivationDetail<TRoute>,
    options: HashRouterRouteActivationOptions = {}
): boolean {
    const {
        preventDefault: shouldPreventDefault = true,
        ...navigateOptions
    } = options;

    if (shouldPreventDefault) {
        detail.event?.preventDefault();
    }

    return router.navigate(detail.route, navigateOptions);
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
    const routeChangeHandlers = new Set<HashRouterRouteChangeHandler<TRoute>>();

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

    function notifyRouteChange(route: TRoute, previousRoute: TRoute | null): void {
        options.onRouteChange?.(route, previousRoute, router);

        routeChangeHandlers.forEach((handler) => {
            handler(route, previousRoute, router);
        });
    }

    function renderRoute(route: TRoute, previousRoute: TRoute | null, navigateOptions: HashRouterNavigateOptions): void {
        const documentMetadata = options.getDocumentMetadata?.(route, previousRoute) ?? null;
        const documentTitle = options.getDocumentTitle
            ? options.getDocumentTitle(route)
            : documentMetadata && "title" in documentMetadata
                ? documentMetadata.title ?? null
                : route.title;

        options.outlet.render(route.render(), {
            title: route.title,
            documentTitle,
            scroll: navigateOptions.scroll ?? true,
            focusTarget: "focusTarget" in navigateOptions
                ? navigateOptions.focusTarget ?? null
                : "first-heading",
            announcement: "announcement" in navigateOptions
                ? navigateOptions.announcement ?? false
                : options.getAnnouncement?.(route, previousRoute) ?? true
        });

        if (documentMetadata) {
            options.updateDocumentMetadata?.(documentMetadata);
        }
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
        renderRoute(route, previousRoute, navigateOptions);
        notifyRouteChange(route, previousRoute);
        options.inspect?.();

        return true;
    }

    function refresh(refreshOptions: HashRouterRefreshOptions = {}): boolean {
        const {
            notify: shouldNotify = false,
            ...navigateOptions
        } = refreshOptions;
        const route = getCurrentRoute();
        const previousRoute = currentRoute;

        currentRoute = route;
        syncNavigation(route);
        renderRoute(route, previousRoute, {
            scroll: false,
            focusTarget: null,
            announcement: false,
            ...navigateOptions
        });

        if (shouldNotify) {
            notifyRouteChange(route, previousRoute);
        }

        options.inspect?.();

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
        refresh,
        syncFromLocation,

        setNavigation(nextNavigation): void {
            navigation = nextNavigation;
            syncNavigation(getCurrentRoute());
        },

        subscribe(handler): HashRouterUnsubscribe {
            routeChangeHandlers.add(handler);

            return () => {
                routeChangeHandlers.delete(handler);
            };
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