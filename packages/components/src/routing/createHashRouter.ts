import type { CompositionContent } from "../composition";
import { discardPreparedContent } from "../composition/preparedContent";
import { runCleanups } from "../../../core/src/events";
import type { DocumentMetadataUpdateOptions } from "../document-metadata";
import type { ComposedPageOutlet, PageOutletAnnouncement, PageOutletFocusTarget } from "../page-outlet";
import type { HashRouterRouteMatcher } from "./createHashRouterRoutePattern";

/**
 * Route definition accepted by createHashRouter().
 */
export interface HashRouterRoute {
    id: string;
    title: string;
    /**
     * Optional focus target used after this route renders.
     * Navigation options still take precedence for one-off overrides.
     */
    focusTarget?: Exclude<PageOutletFocusTarget, null>;
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
 * Handler created for route-aware controls that activate HashRouter routes.
 */
export type HashRouterRouteActivationHandler<TRoute extends HashRouterRoute> = (
    detail: HashRouterRouteActivationDetail<TRoute>
) => boolean;

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
    /** Optional parameterized route matchers evaluated after exact route ids. */
    routePatterns?: readonly HashRouterRouteMatcher<TRoute>[];
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
    /** Parameterized route matchers registered alongside exact routes. */
    readonly routePatterns: readonly HashRouterRouteMatcher<TRoute>[];
    getCurrentRoute(): TRoute;
    getRouteHref(routeOrId: TRoute | string): string;
    getRouteById(id: string | null | undefined): TRoute | null;
    /** Finds a registered parameterized route matcher by its stable definition id. */
    getRoutePatternById(id: string | null | undefined): HashRouterRouteMatcher<TRoute> | null;
    /** Returns false for an unknown route or an operation superseded by a nested transition. */
    navigate(routeOrId: TRoute | string | null | undefined, options?: HashRouterNavigateOptions): boolean;
    refresh(options?: HashRouterRefreshOptions): boolean;
    syncFromLocation(options?: HashRouterNavigateOptions): boolean;
    setNavigation(navigation: HashRouterNavigation | null): void;
    subscribe(handler: HashRouterRouteChangeHandler<TRoute>): HashRouterUnsubscribe;
    start(options?: HashRouterNavigateOptions): void;
    /** Stops location listeners and pending transition effects; manual navigation/restart remain available. */
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

function getHashRouteHref(routeId: string): string {
    return `#${routeId.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
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
 * Creates a reusable callback for route-aware controls that activate HashRouter routes.
 */
export function createHashRouterRouteActivationHandler<TRoute extends HashRouterRoute>(
    router: HashRouter<TRoute>,
    options: HashRouterRouteActivationOptions = {}
): HashRouterRouteActivationHandler<TRoute> {
    return (detail) => activateHashRouterRoute(router, detail, options);
}

/**
 * Creates a lightweight hash-based router for PageOutlet screens.
 */
export function createHashRouter<TRoute extends HashRouterRoute>(
    options: HashRouterOptions<TRoute>
): HashRouter<TRoute> {
    const routes = [...options.routes];
    const routePatterns = [...(options.routePatterns ?? [])];
    const firstRoute = getFirstRoute(routes);
    const ownerWindow = options.outlet.element.ownerDocument.defaultView ?? window;
    const routeChangeHandlers = new Set<HashRouterRouteChangeHandler<TRoute>>();

    let router!: HashRouter<TRoute>;
    let navigation = options.navigation ?? null;
    let currentRoute: TRoute | null = null;
    let renderedRoute: TRoute | null = null;
    let started = false;
    let lastSyncedHash = ownerWindow.location.hash;
    let revision = 0;
    let listenerRevision = 0;

    function getRouteById(id: string | null | undefined, isCurrent = () => true): TRoute | null {
        if (!id) return null;

        const routeId = normalizeRouteId(id);

        const exactRoute = routes.find((route) => route.id === routeId) ?? null;

        if (exactRoute) return exactRoute;

        let matchedRoute: TRoute | null = null;
        let matchedPattern: HashRouterRouteMatcher<TRoute> | null = null;

        for (const pattern of routePatterns) {
            const route = pattern.match(id);

            if (!isCurrent()) return null;
            if (!route) continue;

            if (matchedRoute) {
                throw new Error(
                    `Hash route "${routeId}" matches both patterns "${matchedPattern?.id}" and "${pattern.id}".`
                );
            }

            matchedRoute = route;
            matchedPattern = pattern;
        }

        return matchedRoute;
    }

    function getRoutePatternById(id: string | null | undefined): HashRouterRouteMatcher<TRoute> | null {
        if (!id) return null;

        const patternId = normalizeRouteId(id);

        return routePatterns.find((pattern) => pattern.id === patternId) ?? null;
    }

    function resolveRoute(routeOrId: TRoute | string | null | undefined, isCurrent = () => true): TRoute | null {
        if (!routeOrId) return null;
        if (typeof routeOrId === "string") return getRouteById(routeOrId, isCurrent);

        return getRouteById(routeOrId.id, isCurrent);
    }

    function getDefaultRoute(isCurrent = () => true): TRoute {
        if (options.defaultRoute !== undefined) {
            const route = resolveRoute(options.defaultRoute, isCurrent);

            if (route) return route;
        }

        return firstRoute;
    }

    function getRouteFromLocation(isCurrent = () => true): TRoute {
        const route = getRouteById(ownerWindow.location.hash, isCurrent);
        return route ?? (isCurrent() ? getDefaultRoute(isCurrent) : firstRoute);
    }

    const initialRoute = getRouteFromLocation();

    function getCurrentRoute(): TRoute {
        return currentRoute ?? initialRoute;
    }

    function getRouteHref(routeOrId: TRoute | string): string {
        return getHashRouteHref(getRouteId(routeOrId));
    }

    function beginOperation(): () => boolean {
        const current = ++revision;
        // Invalidate the outlet's queued scroll/announcement and any effects in progress.
        options.outlet.update({});
        return () => revision === current;
    }

    function syncHistory(route: TRoute, navigateOptions: HashRouterNavigateOptions, isCurrent: () => boolean): void {
        const href = getRouteHref(route);

        if (navigateOptions.updateHistory && ownerWindow.location.hash !== href) {
            if (navigateOptions.replaceHistory) {
                ownerWindow.history.replaceState(null, "", href);
            } else {
                ownerWindow.history.pushState(null, "", href);
            }
        }

        if (isCurrent()) lastSyncedHash = ownerWindow.location.hash;
    }

    function syncNavigation(route: TRoute): void {
        navigation?.setCurrent(route.id);
    }

    function focusOutlet(navigateOptions: HashRouterNavigateOptions, isCurrent: () => boolean): void {
        if (navigateOptions.scroll ?? true) {
            options.outlet.element.scrollIntoView({
                block: "start",
                inline: "nearest",
                behavior: "auto"
            });
        }

        if (!isCurrent()) return;
        if ("focusTarget" in navigateOptions) {
            if (navigateOptions.focusTarget !== null) {
                options.outlet.focus(navigateOptions.focusTarget);
            }

            return;
        }

        options.outlet.focus();
    }

    function notifyRouteChange(route: TRoute, previousRoute: TRoute | null, isCurrent: () => boolean): void {
        const handlers = [...routeChangeHandlers];
        options.onRouteChange?.(route, previousRoute, router);

        for (const handler of handlers) {
            if (!isCurrent()) break;
            if (routeChangeHandlers.has(handler)) handler(route, previousRoute, router);
        }
    }

    function renderRoute(route: TRoute, previousRoute: TRoute | null, navigateOptions: HashRouterNavigateOptions, isCurrent: () => boolean): void {
        const documentMetadata = options.getDocumentMetadata?.(route, previousRoute) ?? null;
        if (!isCurrent()) return;
        const documentTitle = options.getDocumentTitle
            ? options.getDocumentTitle(route)
            : documentMetadata && "title" in documentMetadata
                ? documentMetadata.title ?? null
                : route.title;
        if (!isCurrent()) return;
        let content: CompositionContent;
        runCleanups([
            () => {
                renderedRoute = null;
                content = route.render();
                if (!isCurrent()) return;
                const announcement = "announcement" in navigateOptions
                    ? navigateOptions.announcement ?? false
                    : options.getAnnouncement?.(route, previousRoute) ?? true;
                if (!isCurrent()) return;
                options.outlet.render(content, {
                    title: route.title,
                    documentTitle,
                    scroll: navigateOptions.scroll ?? true,
                    focusTarget: "focusTarget" in navigateOptions
                        ? navigateOptions.focusTarget ?? null
                        : route.focusTarget ?? "first-heading",
                    announcement
                });
                if (isCurrent()) renderedRoute = route;
                if (isCurrent() && documentMetadata) options.updateDocumentMetadata?.(documentMetadata);
            },
            () => discardPreparedContent(options.outlet, content)
        ]);
    }

    function navigateResolved(route: TRoute, navigateOptions: HashRouterNavigateOptions): boolean {
        const isCurrent = beginOperation();
        if (!isCurrent()) return false;
        const previousRoute = currentRoute;
        const sameRoute = currentRoute !== null && currentRoute.id === route.id && renderedRoute?.id === route.id;

        syncHistory(route, navigateOptions, isCurrent);
        if (!isCurrent()) return false;
        currentRoute = route;
        syncNavigation(route);
        if (!isCurrent()) return false;

        if (sameRoute) {
            focusOutlet(navigateOptions, isCurrent);
            return isCurrent();
        }

        renderRoute(route, previousRoute, navigateOptions, isCurrent);
        if (!isCurrent()) return false;
        notifyRouteChange(route, previousRoute, isCurrent);
        if (isCurrent()) options.inspect?.();

        return isCurrent();
    }

    function navigate(
        routeOrId: TRoute | string | null | undefined,
        navigateOptions: HashRouterNavigateOptions = {}
    ): boolean {
        const beforeResolution = revision;
        const isCurrent = () => revision === beforeResolution;
        const route = resolveRoute(routeOrId, isCurrent);
        return route && isCurrent() ? navigateResolved(route, navigateOptions) : false;
    }

    function refresh(refreshOptions: HashRouterRefreshOptions = {}): boolean {
        const {
            notify: shouldNotify = false,
            ...navigateOptions
        } = refreshOptions;
        const route = getCurrentRoute();
        const previousRoute = currentRoute;
        const isCurrent = beginOperation();
        if (!isCurrent()) return false;

        currentRoute = route;
        syncNavigation(route);
        if (!isCurrent()) return false;
        renderRoute(route, previousRoute, {
            scroll: false,
            focusTarget: null,
            announcement: false,
            ...navigateOptions
        }, isCurrent);
        if (!isCurrent()) return false;

        if (shouldNotify) {
            notifyRouteChange(route, previousRoute, isCurrent);
        }

        if (isCurrent()) options.inspect?.();

        return isCurrent();
    }

    function syncFromLocation(navigateOptions: HashRouterNavigateOptions = {}): boolean {
        const hash = ownerWindow.location.hash;

        if (hash === lastSyncedHash && currentRoute !== null && renderedRoute?.id === currentRoute.id) {
            return true;
        }

        const beforeResolution = revision;
        const isCurrent = () => revision === beforeResolution;
        const route = getRouteFromLocation(isCurrent);
        return isCurrent() && navigateResolved(route, {
            ...navigateOptions,
            updateHistory: false
        });
    }

    function handleLocationChange(): void {
        syncFromLocation();
    }

    router = {
        routes,
        routePatterns,
        getCurrentRoute,
        getRouteHref,
        getRouteById,
        getRoutePatternById,
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
            const currentListener = ++listenerRevision;
            ownerWindow.addEventListener("popstate", handleLocationChange);
            ownerWindow.addEventListener("hashchange", handleLocationChange);
            try {
                syncFromLocation(startOptions);
            } catch (error) {
                if (started && currentListener === listenerRevision) {
                    try { router.stop(); } catch { /* Preserve the original startup error. */ }
                }
                throw error;
            }
        },

        stop(): void {
            revision += 1;
            listenerRevision += 1;
            const wasStarted = started;
            started = false;
            runCleanups([
                () => { if (wasStarted) ownerWindow.removeEventListener("popstate", handleLocationChange); },
                () => { if (wasStarted) ownerWindow.removeEventListener("hashchange", handleLocationChange); },
                () => options.outlet.update({})
            ]);
        }
    };

    return router;
}
