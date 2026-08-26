import {
    AppShell,
    type AppShellOptions,
    type ComposedAppShell
} from "../app-shell";
import {
    createAppRouteDocumentMetadata,
    getAppRouteById,
    getAppRouteByLocation,
    type AppRouteDescriptor,
    type AppRouteDocumentMetadataOptions,
    type AppRouteLocationInput,
    type AppRouteLocationMatchOptions
} from "../app-routes";
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
    applyRoutedAppChromeSlots,
    getRoutedAppLocaleRefreshOptions,
    setupRoutedAppPageHideCleanup,
    type RoutedAppChromeSlots,
    type RoutedAppLocaleRefreshOptions
} from "./routedAppInternals";

/**
 * Current route value accepted by LinkRoutedApp route-aware controls.
 */
export type LinkRoutedAppCurrent<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = TRoute | string | null | undefined;

/**
 * Native-link route matching options accepted by createLinkRoutedApp().
 */
export type LinkRoutedAppLocationMatchOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = Omit<AppRouteLocationMatchOptions<TRoute>, "location">;

/**
 * Navigation-like control that can mirror the current native-link route.
 */
export interface LinkRoutedAppNavigationControl {
    setCurrent(match: string | null): void;
}

/**
 * Route-aware control that can mirror the current native-link route.
 */
export interface LinkRoutedAppCurrentRouteControl<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    setCurrent(current: LinkRoutedAppCurrent<TRoute>): void;
}

/**
 * Context passed to native-link routed app shell/chrome render callbacks.
 */
export interface LinkRoutedAppContext<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    readonly shell: ComposedAppShell;
    readonly routes: readonly TRoute[];
    readonly route: TRoute | null;
    refreshChrome(): void;
    refresh(options?: LinkRoutedAppRefreshOptions<TRoute>): void;
}

/**
 * Stable page chrome produced by a native-link routed app render callback.
 */
export interface LinkRoutedAppChrome<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends RoutedAppChromeSlots {
    navigationControl?: LinkRoutedAppNavigationControl | null;
    currentRouteControls?: readonly LinkRoutedAppCurrentRouteControl<TRoute>[];
}

/**
 * Creates route-aware shell chrome for the current native-link app state.
 */
export type LinkRoutedAppChromeRenderer<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = (context: LinkRoutedAppContext<TRoute>) => LinkRoutedAppChrome<TRoute> | null | undefined;

/**
 * Locale refresh options accepted by createLinkRoutedApp().
 */
export interface LinkRoutedAppLocaleRefreshOptions<
    TLocale extends LocaleCode = LocaleCode
> extends RoutedAppLocaleRefreshOptions<TLocale> {}

/**
 * Manual refresh options for a native-link routed app.
 */
export interface LinkRoutedAppRefreshOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    current?: LinkRoutedAppCurrent<TRoute>;
    location?: AppRouteLocationInput;
    matchLocation?: LinkRoutedAppLocationMatchOptions<TRoute>;
    chrome?: boolean;
    metadata?: boolean;
}

/**
 * Options for createLinkRoutedApp().
 */
export interface LinkRoutedAppOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor,
    TLocale extends LocaleCode = LocaleCode
> {
    routes: readonly TRoute[];
    shell?: AppShellOptions;
    current?: LinkRoutedAppCurrent<TRoute>;
    location?: AppRouteLocationInput;
    matchLocation?: LinkRoutedAppLocationMatchOptions<TRoute>;
    routeMetadata?: AppRouteDocumentMetadataOptions<TRoute> | false;
    updateDocumentMetadata?: ((
        metadata: DocumentMetadataUpdateOptions,
        context: LinkRoutedAppContext<TRoute>
    ) => void) | null;
    locale?: LocaleRefreshLocale<TLocale> | null;
    localeRefresh?: LinkRoutedAppLocaleRefreshOptions<TLocale> | false;
    renderChrome?: LinkRoutedAppChromeRenderer<TRoute> | null;
    mount?: MountTarget | false | null;
    mountOptions?: MountOptions;
    destroyOnPageHide?: boolean;
}

/**
 * Runtime controller returned by createLinkRoutedApp().
 */
export interface LinkRoutedApp<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    readonly shell: ComposedAppShell;
    readonly routes: readonly TRoute[];
    getCurrentRoute(): TRoute | null;
    mount(target: MountTarget, options?: MountOptions): MountedTree;
    refreshChrome(): void;
    refresh(options?: LinkRoutedAppRefreshOptions<TRoute>): void;
    destroy(): void;
    isDestroyed(): boolean;
}


function getRouteFromCurrent<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    current: LinkRoutedAppCurrent<TRoute>
): TRoute | null {
    if (typeof current === "string") return getAppRouteById(routes, current);

    return current ?? null;
}

function getRouteFromLocation<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    appOptions: Pick<LinkRoutedAppOptions<TRoute>, "location" | "matchLocation">,
    refreshOptions: Pick<LinkRoutedAppRefreshOptions<TRoute>, "location" | "matchLocation"> = {}
): TRoute | null {
    const locationOptions: AppRouteLocationMatchOptions<TRoute> = {};
    const matchLocation = refreshOptions.matchLocation ?? appOptions.matchLocation;
    const location = refreshOptions.location ?? appOptions.location;

    if (location !== undefined) locationOptions.location = location;
    if (matchLocation?.baseUrl !== undefined) locationOptions.baseUrl = matchLocation.baseUrl;
    if (matchLocation?.matchMode !== undefined) locationOptions.matchMode = matchLocation.matchMode;
    if (matchLocation?.getHref !== undefined) locationOptions.getHref = matchLocation.getHref;

    return getAppRouteByLocation(routes, locationOptions);
}

/**
 * Creates a lightweight app runtime for multi-page apps and native-link routing.
 */
export function createLinkRoutedApp<
    TRoute extends AppRouteDescriptor,
    TLocale extends LocaleCode = LocaleCode
>(options: LinkRoutedAppOptions<TRoute, TLocale>): LinkRoutedApp<TRoute> {
    const routes = [...options.routes];
    const shell = AppShell(options.shell ?? {});

    let app!: LinkRoutedApp<TRoute>;
    let mountedTree: MountedTree | null = null;
    let localeRefresh: LocaleRefreshController | null = null;
    let removePageHideListener: (() => void) | null = null;
    let navigationControl: LinkRoutedAppNavigationControl | null = null;
    let currentRouteControls: readonly LinkRoutedAppCurrentRouteControl<TRoute>[] = [];
    let currentRoute = "current" in options
        ? getRouteFromCurrent(routes, options.current)
        : getRouteFromLocation(routes, options);
    let destroyed = false;

    function getContext(): LinkRoutedAppContext<TRoute> {
        return {
            shell,
            routes,
            route: currentRoute,
            refreshChrome,
            refresh
        };
    }

    function resolveCurrentRoute(refreshOptions: LinkRoutedAppRefreshOptions<TRoute>): TRoute | null {
        if ("current" in refreshOptions) {
            return getRouteFromCurrent(routes, refreshOptions.current);
        }

        return getRouteFromLocation(routes, options, refreshOptions);
    }

    function clearRouteControls(): void {
        navigationControl = null;
        currentRouteControls = [];
    }

    function syncRouteControls(): void {
        const currentId = currentRoute?.id ?? null;

        navigationControl?.setCurrent(currentId);
        currentRouteControls.forEach((control) => {
            control.setCurrent(currentRoute);
        });
    }

    function bindChromeRouteControls(chrome: LinkRoutedAppChrome<TRoute>): void {
        navigationControl = "navigationControl" in chrome
            ? chrome.navigationControl ?? null
            : null;
        currentRouteControls = chrome.currentRouteControls ?? [];
        syncRouteControls();
    }


    function refreshChrome(): void {
        if (destroyed) return;

        clearRouteControls();

        const chrome = options.renderChrome?.(getContext()) ?? null;

        if (!chrome) return;

        applyRoutedAppChromeSlots(shell, chrome);
        bindChromeRouteControls(chrome);
    }

    function refreshMetadata(): void {
        if (destroyed || !currentRoute || options.routeMetadata === false) return;

        const metadata = createAppRouteDocumentMetadata(currentRoute, options.routeMetadata ?? {});
        const context = getContext();

        if (options.updateDocumentMetadata) {
            options.updateDocumentMetadata(metadata, context);
            return;
        }

        shell.updateMetadata(metadata);
    }

    function refresh(refreshOptions: LinkRoutedAppRefreshOptions<TRoute> = {}): void {
        if (destroyed) return;

        currentRoute = resolveCurrentRoute(refreshOptions);

        if (refreshOptions.chrome ?? true) {
            refreshChrome();
        } else {
            syncRouteControls();
        }

        if (refreshOptions.metadata ?? true) {
            refreshMetadata();
        }
    }

    function setupLocaleRefresh(): void {
        const locale = options.locale;

        if (!locale) return;

        const refreshOptions = getRoutedAppLocaleRefreshOptions(locale, options.localeRefresh, () => {
            refresh({
                chrome: true,
                metadata: true
            });
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
        routes,

        getCurrentRoute(): TRoute | null {
            return currentRoute;
        },

        mount(target, mountOptions = {}): MountedTree {
            if (destroyed) {
                throw new Error("Cannot mount a destroyed LinkRoutedApp.");
            }

            mountedTree = mountTree(shell, target, mountOptions);

            return mountedTree;
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
    refresh({
        chrome: true,
        metadata: true
    });

    if (options.mount !== undefined && options.mount !== null && options.mount !== false) {
        app.mount(options.mount, options.mountOptions ?? {});
    }

    return app;
}
