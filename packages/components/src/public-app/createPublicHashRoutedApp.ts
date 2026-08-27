import type {
    AppDiagnosticsReport,
    AppDiagnosticsRunner
} from "../app-diagnostics";
import type {
    AppIdentity,
    AppIdentityRouteDocumentMetadataOptions
} from "../app-identity";
import {
    createAppRouteDocumentMetadata,
    getAppRouteDocumentTitle,
    type AppRouteDescriptor,
    type AppRouteDocumentMetadataOptions
} from "../app-routes";
import {
    resetInitialScrollPosition,
    type InitialScrollResetController,
    type InitialScrollResetOptions
} from "../foundation";
import type { LocaleCode } from "../localization";
import {
    createHashRoutedApp,
    type HashRoutedApp,
    type HashRoutedAppOptions,
    type HashRoutedAppRouterOptions
} from "../routed-app";
import type {
    HashRouterNavigateOptions,
    HashRouterRoute
} from "../routing";
import {
    createPublicRoutedAppDiagnostics,
    type PublicRoutedAppDiagnosticsOptions
} from "./createPublicRoutedAppDiagnostics";
import {
    applyPublicAppIdentityDiagnosticsDefaults,
    createPublicAppRouteDocumentMetadataOptions
} from "./publicAppInternals";

/**
 * Route contract for public hash-routed app recipes.
 */
export type PublicHashRoutedAppRoute = AppRouteDescriptor & HashRouterRoute;

/**
 * Initial scroll reset behavior accepted by createPublicHashRoutedApp().
 */
export type PublicHashRoutedAppInitialScrollReset = InitialScrollResetOptions | false;

/**
 * Route metadata automation accepted by createPublicHashRoutedApp().
 */
export type PublicHashRoutedAppRouteMetadataOptions<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute
> = AppIdentityRouteDocumentMetadataOptions<TRoute> | false;

/**
 * Diagnostics options accepted by createPublicHashRoutedApp().
 */
export interface PublicHashRoutedAppDiagnosticsOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string,
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute
> extends PublicRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> {
    /** Logs fresh diagnostics through the router inspect hook after route renders and refreshes. */
    logOnRouteChange?: boolean;
}

/**
 * Options for createPublicHashRoutedApp().
 */
export interface PublicHashRoutedAppOptions<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> extends Omit<HashRoutedAppOptions<TRoute, TLocale>, "start"> {
    /** Stable public app identity used by route metadata, diagnostics, and manifest helpers. */
    identity?: AppIdentity | null;
    /** Identity-aware route metadata defaults, or false to disable route metadata automation. */
    routeMetadata?: PublicHashRoutedAppRouteMetadataOptions<TRoute>;
    /** Starts the hash router after diagnostics are connected. Defaults to true. */
    start?: boolean;
    /** Resets browser-restored page scroll after startup. Pass false to disable. */
    initialScrollReset?: PublicHashRoutedAppInitialScrollReset;
    /** Public app diagnostics recipe options. Pass false to disable diagnostics. */
    diagnostics?: PublicHashRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> | false;
}

/**
 * Runtime controller returned by createPublicHashRoutedApp().
 */
export interface PublicHashRoutedApp<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute
> extends HashRoutedApp<TRoute> {
    /** Diagnostics runner created for the app, or null when diagnostics are disabled. */
    readonly diagnostics: AppDiagnosticsRunner | null;
    /** Controller for the latest startup scroll reset, or null when disabled/not started. */
    readonly initialScrollReset: InitialScrollResetController | null;
    /** Returns a fresh diagnostics report without logging it. */
    inspectDiagnostics(): AppDiagnosticsReport | null;
    /** Logs and returns a fresh diagnostics report. */
    logDiagnostics(): AppDiagnosticsReport | null;
}

function shouldLogDiagnosticsOnRouteChange<
    TLocale extends LocaleCode,
    TKey extends string,
    TRoute extends PublicHashRoutedAppRoute
>(options: PublicHashRoutedAppOptions<TRoute, TLocale, TKey>): boolean {
    return options.diagnostics !== false
        && options.diagnostics?.logOnRouteChange === true;
}

function getRouteDocumentMetadataOptions<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicHashRoutedAppOptions<TRoute, TLocale, TKey>
): AppRouteDocumentMetadataOptions<TRoute> | null {
    const routeMetadataOptions = createPublicAppRouteDocumentMetadataOptions(
        options.identity,
        options.routeMetadata
    );

    return routeMetadataOptions === undefined || routeMetadataOptions === false
        ? null
        : routeMetadataOptions;
}

function createRouterOptions<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicHashRoutedAppOptions<TRoute, TLocale, TKey>,
    getDiagnostics: () => AppDiagnosticsRunner | null
): HashRoutedAppRouterOptions<TRoute> | undefined {
    const routerOptions = options.router;
    const userInspect = routerOptions?.inspect ?? null;
    const shouldLogDiagnostics = shouldLogDiagnosticsOnRouteChange(options);
    const routeMetadataOptions = getRouteDocumentMetadataOptions(options);
    const nextOptions: HashRoutedAppRouterOptions<TRoute> = {
        ...(routerOptions ?? {})
    };
    let hasGeneratedOptions = false;

    if (routeMetadataOptions) {
        if (nextOptions.getDocumentTitle === undefined) {
            nextOptions.getDocumentTitle = (route) => getAppRouteDocumentTitle(route, routeMetadataOptions);
            hasGeneratedOptions = true;
        }

        if (nextOptions.getDocumentMetadata === undefined) {
            nextOptions.getDocumentMetadata = (route) => createAppRouteDocumentMetadata(route, routeMetadataOptions);
            hasGeneratedOptions = true;
        }
    }

    if (userInspect || shouldLogDiagnostics) {
        nextOptions.inspect = () => {
            userInspect?.();
            if (shouldLogDiagnostics) getDiagnostics()?.log();
        };
        hasGeneratedOptions = true;
    }

    return hasGeneratedOptions ? nextOptions : routerOptions;
}

function getDiagnosticsOptions<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicHashRoutedAppOptions<TRoute, TLocale, TKey>
): PublicRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> | false | undefined {
    if (options.diagnostics === false) return false;

    const diagnosticsOptions: PublicHashRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> = options.diagnostics ?? {};
    const {
        logOnRouteChange: _logOnRouteChange,
        ...publicDiagnosticsOptions
    } = diagnosticsOptions;

    return applyPublicAppIdentityDiagnosticsDefaults(
        publicDiagnosticsOptions,
        options.identity,
        options.routeMetadata
    );
}

function resetStartupScroll(
    options: PublicHashRoutedAppInitialScrollReset | undefined
): InitialScrollResetController | null {
    if (options === false) return null;

    return resetInitialScrollPosition(options ?? {});
}

/**
 * Creates the public-app SPA recipe: HashRoutedApp plus diagnostics and startup scroll reset.
 */
export function createPublicHashRoutedApp<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
>(options: PublicHashRoutedAppOptions<TRoute, TLocale, TKey>): PublicHashRoutedApp<TRoute> {
    const {
        diagnostics: _diagnostics,
        identity: _identity,
        initialScrollReset,
        routeMetadata: _routeMetadata,
        start,
        ...hashRoutedAppOptions
    } = options;
    let diagnostics: AppDiagnosticsRunner | null = null;
    let initialScrollResetController: InitialScrollResetController | null = null;
    let started = false;

    const router = createRouterOptions(options, () => diagnostics);
    const routedAppOptions: HashRoutedAppOptions<TRoute, TLocale> = {
        ...hashRoutedAppOptions,
        start: false
    };

    if (router !== undefined) routedAppOptions.router = router;

    const routedApp = createHashRoutedApp(routedAppOptions);

    diagnostics = createPublicRoutedAppDiagnostics(routedApp, getDiagnosticsOptions(options));

    const publicApp: PublicHashRoutedApp<TRoute> = {
        shell: routedApp.shell,
        router: routedApp.router,
        routes: routedApp.routes,

        get diagnostics(): AppDiagnosticsRunner | null {
            return diagnostics;
        },

        get initialScrollReset(): InitialScrollResetController | null {
            return initialScrollResetController;
        },

        mount(target, mountOptions) {
            return routedApp.mount(target, mountOptions);
        },

        start(startOptions: HashRouterNavigateOptions = options.startOptions ?? {}): void {
            if (started || routedApp.isDestroyed()) return;

            started = true;
            routedApp.start(startOptions);
            initialScrollResetController?.cancel();
            initialScrollResetController = resetStartupScroll(initialScrollReset);
        },

        refreshChrome(): void {
            routedApp.refreshChrome();
        },

        refresh(refreshOptions): void {
            routedApp.refresh(refreshOptions);
        },

        inspectDiagnostics(): AppDiagnosticsReport | null {
            return diagnostics?.inspect() ?? null;
        },

        logDiagnostics(): AppDiagnosticsReport | null {
            return diagnostics?.log() ?? null;
        },

        destroy(): void {
            initialScrollResetController?.cancel();
            initialScrollResetController = null;
            routedApp.destroy();
        },

        isDestroyed(): boolean {
            return routedApp.isDestroyed();
        }
    };

    if (start !== false) {
        publicApp.start(options.startOptions ?? {});
    }

    return publicApp;
}
