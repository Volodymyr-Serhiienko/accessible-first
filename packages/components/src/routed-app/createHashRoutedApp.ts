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

    function clearRouteControls(): void {
        routeControlsCleanup?.();
        routeControlsCleanup = null;

        if (hasBoundNavigation) {
            router.setNavigation(null);
            hasBoundNavigation = false;
        }
    }

    function bindChromeRouteControls(chrome: HashRoutedAppChrome<TRoute>): void {
        const hasNavigationControl = "navigationControl" in chrome;
        const currentRouteControls = chrome.currentRouteControls ?? [];

        if (!hasNavigationControl && currentRouteControls.length === 0) return;

        routeControlsCleanup = bindHashRouterRouteControls(router, {
            navigation: hasNavigationControl ? chrome.navigationControl ?? null : null,
            currentRouteControls
        });
        hasBoundNavigation = hasNavigationControl;
    }


    function refreshChrome(): void {
        if (destroyed) return;

        clearRouteControls();

        const chrome = options.renderChrome?.(getContext()) ?? null;

        if (!chrome) return;

        applyRoutedAppChromeSlots(shell, chrome);
        bindChromeRouteControls(chrome);
    }

    function refresh(refreshOptions: HashRoutedAppRefreshOptions = {}): void {
        if (destroyed) return;

        if (refreshOptions.chrome ?? true) {
            refreshChrome();
        }

        if (refreshOptions.route ?? true) {
            router.refresh(refreshOptions.routeOptions ?? defaultLocaleRefreshRouteOptions);
        }
    }

    const router = createHashRouter<TRoute>({
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
            routerOnRouteChange?.(route, previousRoute, nextRouter);

            if (options.refreshChromeOnRouteChange) {
                refreshChrome();
            }
        }
    });

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
            removePageHideListener?.();
            removePageHideListener = null;
            localeRefresh?.destroy();
            localeRefresh = null;
            clearRouteControls();
            router.stop();

            if (mountedTree) {
                mountedTree.unmount();
                mountedTree = null;
                return;
            }

            shell.destroy();
        },

        isDestroyed(): boolean {
            return destroyed;
        }
    };

    setupLocaleRefresh();
    setupPageHideCleanup();
    refreshChrome();

    if (options.mount !== undefined && options.mount !== null && options.mount !== false) {
        app.mount(options.mount, options.mountOptions ?? {});
    }

    if (options.start !== false) {
        app.start(options.startOptions ?? {});
    }

    return app;
}
