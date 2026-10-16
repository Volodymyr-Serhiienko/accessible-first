import {
    AppShell,
    type AppShellOptions,
    type ComposedAppShell
} from "../app-shell";
import {
    mount as mountTree,
    type MountedTree,
    type MountOptions,
    type MountTarget
} from "../composition";
import type { DocumentMetadataUpdateOptions } from "../document-metadata";
import { runCleanups } from "../../../core/src/events";
import { discardPreparedContent } from "../composition/preparedContent";
import {
    createLocaleRefresh,
    type LocaleCode,
    type LocaleRefreshController,
    type LocaleRefreshLocale
} from "../localization";
import {
    bindHashRouterRouteControls,
    createHashRouter,
    type HashRouter,
    type HashRouterCurrentRouteControl,
    type HashRouterNavigateOptions,
    type HashRouterNavigation,
    type HashRouterOptions,
    type HashRouterRefreshOptions,
    type HashRouterRoute,
    type HashRouterRouteChangeHandler,
    type HashRouterUnsubscribe
} from "../routing";
import {
    applyRoutedAppChromeSlots,
    getRoutedAppChromeContent,
    getRoutedAppLocaleRefreshOptions,
    setupRoutedAppPageHideCleanup,
    type RoutedAppChromeSlots,
    type RoutedAppLocaleRefreshOptions
} from "./routedAppInternals";

const defaultLocaleRefreshRouteOptions: HashRouterRefreshOptions = {
    scroll: false,
    focusTarget: null,
    announcement: false
};

/**
 * Context passed to routed app shell/chrome render callbacks.
 */
export interface HashRoutedAppContext<
    TRoute extends HashRouterRoute = HashRouterRoute
> {
    readonly shell: ComposedAppShell;
    readonly router: HashRouter<TRoute>;
    readonly routes: readonly TRoute[];
    readonly route: TRoute;
    refreshChrome(): void;
    refresh(options?: HashRoutedAppRefreshOptions): void;
}

/**
 * Stable page chrome produced by a routed app render callback.
 */
export interface HashRoutedAppChrome<
    TRoute extends HashRouterRoute = HashRouterRoute
> extends RoutedAppChromeSlots {
    navigationControl?: HashRouterNavigation | null;
    currentRouteControls?: readonly HashRouterCurrentRouteControl<TRoute>[];
}

/**
 * Creates route-aware shell chrome for the current routed app state.
 */
export type HashRoutedAppChromeRenderer<
    TRoute extends HashRouterRoute = HashRouterRoute
> = (context: HashRoutedAppContext<TRoute>) => HashRoutedAppChrome<TRoute> | null | undefined;

/**
 * HashRouter options accepted by createHashRoutedApp().
 */
export interface HashRoutedAppRouterOptions<
    TRoute extends HashRouterRoute = HashRouterRoute
> extends Omit<
        HashRouterOptions<TRoute>,
        "routes" | "outlet" | "updateDocumentMetadata" | "onRouteChange"
    > {
    updateDocumentMetadata?: ((
        metadata: DocumentMetadataUpdateOptions,
        context: HashRoutedAppContext<TRoute>
    ) => void) | null;
    onRouteChange?: HashRouterRouteChangeHandler<TRoute> | null;
}

/**
 * Locale refresh options accepted by createHashRoutedApp().
 */
export interface HashRoutedAppLocaleRefreshOptions<
    TLocale extends LocaleCode = LocaleCode
> extends RoutedAppLocaleRefreshOptions<TLocale> {
    routeOptions?: HashRouterRefreshOptions | false;
}

/**
 * Manual refresh options for a hash-routed app.
 */
export interface HashRoutedAppRefreshOptions {
    chrome?: boolean;
    route?: boolean;
    routeOptions?: HashRouterRefreshOptions;
}

/**
 * Options for createHashRoutedApp().
 */
export interface HashRoutedAppOptions<
    TRoute extends HashRouterRoute = HashRouterRoute,
    TLocale extends LocaleCode = LocaleCode
> {
    routes: readonly TRoute[];
    shell?: AppShellOptions;
    router?: HashRoutedAppRouterOptions<TRoute>;
    locale?: LocaleRefreshLocale<TLocale> | null;
    localeRefresh?: HashRoutedAppLocaleRefreshOptions<TLocale> | false;
    renderChrome?: HashRoutedAppChromeRenderer<TRoute> | null;
    refreshChromeOnRouteChange?: boolean;
    mount?: MountTarget | false | null;
    mountOptions?: MountOptions;
    start?: boolean;
    startOptions?: HashRouterNavigateOptions;
    destroyOnPageHide?: boolean;
}

/**
 * Runtime controller returned by createHashRoutedApp().
 */
export interface HashRoutedApp<
    TRoute extends HashRouterRoute = HashRouterRoute
> {
    readonly shell: ComposedAppShell;
    readonly router: HashRouter<TRoute>;
    readonly routes: readonly TRoute[];
    mount(target: MountTarget, options?: MountOptions): MountedTree;
    start(options?: HashRouterNavigateOptions): void;
    refreshChrome(): void;
    refresh(options?: HashRoutedAppRefreshOptions): void;
    destroy(): void;
    isDestroyed(): boolean;
}

function getLocaleRefreshRouteOptions<
    TLocale extends LocaleCode
>(
    options: HashRoutedAppLocaleRefreshOptions<TLocale> | false | undefined
): HashRouterRefreshOptions | false {
    if (options === false) return false;

    return options?.routeOptions ?? defaultLocaleRefreshRouteOptions;
}

/**
 * Creates a lightweight SPA runtime around AppShell, HashRouter, route controls, and locale refresh.
 */
export function createHashRoutedApp<
    TRoute extends HashRouterRoute,
    TLocale extends LocaleCode = LocaleCode
>(options: HashRoutedAppOptions<TRoute, TLocale>): HashRoutedApp<TRoute> {
    const routes = [...options.routes];
    const shell = AppShell(options.shell ?? {});
    const routerOptions = options.router ?? {};
    const routerUpdateDocumentMetadata = routerOptions.updateDocumentMetadata ?? null;
    const routerOnRouteChange = routerOptions.onRouteChange ?? null;
    const {
        updateDocumentMetadata: _updateDocumentMetadata,
        onRouteChange: _onRouteChange,
        ...hashRouterOptions
    } = routerOptions;

    let app!: HashRoutedApp<TRoute>;
    let mountedTree: MountedTree | null = null;
    let routeControlsCleanup: HashRouterUnsubscribe | null = null;
    let localeRefresh: LocaleRefreshController | null = null;
    let removePageHideListener: (() => void) | null = null;
    let hasBoundNavigation = false;
    let started = false;
    let destroyed = false;
    let revision = 0;
    let binding: object | null = null;
    let chromeAttempt: object | null = null;

    function isCurrent(current: number): boolean {
        return !destroyed && current === revision;
    }

    function getContext(): HashRoutedAppContext<TRoute> {
        return {
            shell,
            router,
            routes,
            route: router.getCurrentRoute(),
            refreshChrome,
            refresh
        };
    }

    function clearRouteControls(current?: number): void {
        const cleanup = routeControlsCleanup;
        const unbindNavigation = hasBoundNavigation;
        routeControlsCleanup = null;
        hasBoundNavigation = false;
        binding = null;
        runCleanups([() => cleanup?.(), () => {
            if (unbindNavigation && (current === undefined || isCurrent(current))) router.setNavigation(null);
        }]);
    }

    function bindChromeRouteControls(chrome: HashRoutedAppChrome<TRoute>): void {
        const hasNavigationControl = "navigationControl" in chrome;
        const currentRouteControls = chrome.currentRouteControls ?? [];

        if (!hasNavigationControl && currentRouteControls.length === 0) return;
        const token = {};
        binding = token;
        hasBoundNavigation = hasNavigationControl;
        const active = (): boolean => !destroyed && binding === token;
        const navigation = chrome.navigationControl;
        let cleanup: HashRouterUnsubscribe;
        try {
            cleanup = bindHashRouterRouteControls(router, {
                navigation: hasNavigationControl && navigation ? {
                    setCurrent(id) { if (active() && router.getCurrentRoute().id === id) navigation.setCurrent(id); }
                } : null,
                currentRouteControls: currentRouteControls.map(control => ({
                    setCurrent(route) {
                        if (active() && route && typeof route === "object" && router.getCurrentRoute().id === route.id) control.setCurrent(route);
                    }
                }))
            });
        } catch (error) {
            try { if (binding === token) clearRouteControls(); }
            finally { throw error; }
        }
        if (active()) routeControlsCleanup = cleanup;
        else cleanup();
    }

    function runRefreshChrome(current: number): void {
        const attempt = {};
        chromeAttempt = attempt;
        const chrome = options.renderChrome?.(getContext()) ?? null;

        if (!chrome) {
            if (isCurrent(current)) clearRouteControls(current);
            return;
        }
        const candidates = getRoutedAppChromeContent(chrome);
        runCleanups([
            () => {
                if (!isCurrent(current)) return;
                clearRouteControls(current);
                if (!isCurrent(current)) return;
                applyRoutedAppChromeSlots(shell, chrome);
                if (!destroyed && chromeAttempt === attempt) bindChromeRouteControls(chrome);
            },
            () => discardPreparedContent(shell, candidates)
        ]);
    }

    function refreshChrome(): void {
        if (destroyed) return;
        runRefreshChrome(++revision);
    }

    function refresh(refreshOptions: HashRoutedAppRefreshOptions = {}): void {
        if (destroyed) return;
        const current = ++revision;

        if (refreshOptions.chrome ?? true) {
            runRefreshChrome(current);
        }

        if (isCurrent(current) && (refreshOptions.route ?? true)) {
            router.refresh(refreshOptions.routeOptions ?? defaultLocaleRefreshRouteOptions);
        }
    }

    let router: HashRouter<TRoute>;
    try {
        router = createHashRouter<TRoute>({
            ...hashRouterOptions,
            routes,
            outlet: shell.outlet,
            updateDocumentMetadata(metadata) {
                if (routerUpdateDocumentMetadata) {
                    routerUpdateDocumentMetadata(metadata, getContext());
                    return;
                }

                shell.updateMetadata(metadata);
            },
            onRouteChange(route, previousRoute, nextRouter) {
                const current = revision;
                routerOnRouteChange?.(route, previousRoute, nextRouter);

                if (isCurrent(current) && nextRouter.getCurrentRoute().id === route.id && options.refreshChromeOnRouteChange) refreshChrome();
            }
        });
    } catch (error) {
        try { shell.destroy(); }
        finally { throw error; }
    }

    function setupLocaleRefresh(): void {
        const locale = options.locale;

        if (!locale) return;

        const routeOptions = getLocaleRefreshRouteOptions(options.localeRefresh);
        const refreshOptions = getRoutedAppLocaleRefreshOptions(locale, options.localeRefresh, () => {
            const shouldRefreshRoute = routeOptions !== false;
            const nextRefreshOptions: HashRoutedAppRefreshOptions = {
                chrome: true,
                route: shouldRefreshRoute
            };

            if (shouldRefreshRoute) {
                nextRefreshOptions.routeOptions = routeOptions;
            }

            refresh(nextRefreshOptions);
        });

        if (!refreshOptions) return;

        localeRefresh = createLocaleRefresh(refreshOptions);
    }

    function setupPageHideCleanup(): void {
        removePageHideListener = setupRoutedAppPageHideCleanup(
            shell,
            () => app.destroy(),
            options.destroyOnPageHide
        );
    }

    app = {
        shell,
        router,
        routes,

        mount(target, mountOptions = {}): MountedTree {
            if (destroyed) {
                throw new Error("Cannot mount a destroyed HashRoutedApp.");
            }

            mountedTree = mountTree(shell, target, mountOptions);

            return mountedTree;
        },

        start(startOptions = options.startOptions ?? {}): void {
            if (destroyed || started) return;

            started = true;
            router.start(startOptions);
        },

        refreshChrome,
        refresh,

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            revision += 1;
            const removePageHide = removePageHideListener;
            const refreshController = localeRefresh;
            const tree = mountedTree;
            removePageHideListener = null;
            localeRefresh = null;
            mountedTree = null;
            runCleanups([() => removePageHide?.(), () => refreshController?.destroy(),
                clearRouteControls, () => router.stop(), () => tree ? tree.unmount() : shell.destroy()]);
        },

        isDestroyed(): boolean {
            return destroyed;
        }
    };

    try {
        setupLocaleRefresh();
        setupPageHideCleanup();
        refreshChrome();

        if (options.mount !== undefined && options.mount !== null && options.mount !== false) {
            app.mount(options.mount, options.mountOptions ?? {});
        }

        if (options.start !== false) app.start(options.startOptions ?? {});
    } catch (error) {
        try { app.destroy(); }
        finally { throw error; }
    }

    return app;
}
