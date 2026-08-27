import type {
    AppDiagnosticsReport,
    AppDiagnosticsRunner
} from "../app-diagnostics";
import type {
    AppIdentity,
    AppIdentityRouteDocumentMetadataOptions
} from "../app-identity";
import type { AppRouteDescriptor } from "../app-routes";
import type { LocaleCode } from "../localization";
import {
    createLinkRoutedApp,
    type LinkRoutedApp,
    type LinkRoutedAppOptions,
    type LinkRoutedAppRefreshOptions
} from "../routed-app";
import {
    createPublicRoutedAppDiagnostics,
    type PublicRoutedAppDiagnosticsOptions
} from "./createPublicRoutedAppDiagnostics";
import {
    applyPublicAppIdentityDiagnosticsDefaults,
    createPublicAppRouteDocumentMetadataOptions
} from "./publicAppInternals";

/**
 * Route contract for public native-link app recipes.
 */
export type PublicLinkRoutedAppRoute = AppRouteDescriptor;

/**
 * Route metadata automation accepted by createPublicLinkRoutedApp().
 */
export type PublicLinkRoutedAppRouteMetadataOptions<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute
> = AppIdentityRouteDocumentMetadataOptions<TRoute> | false;

/**
 * Diagnostics options accepted by createPublicLinkRoutedApp().
 */
export interface PublicLinkRoutedAppDiagnosticsOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string,
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute
> extends PublicRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> {
    /** Logs diagnostics once after the app and diagnostics runner are created. */
    logOnCreate?: boolean;
    /** Logs diagnostics after refresh() calls made through the public app controller. */
    logOnRefresh?: boolean;
}

/**
 * Options for createPublicLinkRoutedApp().
 */
export interface PublicLinkRoutedAppOptions<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> extends Omit<LinkRoutedAppOptions<TRoute, TLocale>, "routeMetadata"> {
    /** Stable public app identity used by route metadata, diagnostics, and manifest helpers. */
    identity?: AppIdentity | null;
    /** Identity-aware route metadata defaults, or false to disable route metadata automation. */
    routeMetadata?: PublicLinkRoutedAppRouteMetadataOptions<TRoute>;
    /** Public app diagnostics recipe options. Pass false to disable diagnostics. */
    diagnostics?: PublicLinkRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> | false;
}

/**
 * Runtime controller returned by createPublicLinkRoutedApp().
 */
export interface PublicLinkRoutedApp<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute
> extends LinkRoutedApp<TRoute> {
    /** Diagnostics runner created for the app, or null when diagnostics are disabled. */
    readonly diagnostics: AppDiagnosticsRunner | null;
    /** Returns a fresh diagnostics report without logging it. */
    inspectDiagnostics(): AppDiagnosticsReport | null;
    /** Logs and returns a fresh diagnostics report. */
    logDiagnostics(): AppDiagnosticsReport | null;
}

function shouldLogDiagnosticsOnCreate<
    TLocale extends LocaleCode,
    TKey extends string,
    TRoute extends PublicLinkRoutedAppRoute
>(options: PublicLinkRoutedAppOptions<TRoute, TLocale, TKey>): boolean {
    return options.diagnostics !== false
        && options.diagnostics?.logOnCreate === true;
}

function shouldLogDiagnosticsOnRefresh<
    TLocale extends LocaleCode,
    TKey extends string,
    TRoute extends PublicLinkRoutedAppRoute
>(options: PublicLinkRoutedAppOptions<TRoute, TLocale, TKey>): boolean {
    return options.diagnostics !== false
        && options.diagnostics?.logOnRefresh === true;
}

function getDiagnosticsOptions<
    TRoute extends PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicLinkRoutedAppOptions<TRoute, TLocale, TKey>
): PublicRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> | false | undefined {
    if (options.diagnostics === false) return false;

    const diagnosticsOptions: PublicLinkRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> = options.diagnostics ?? {};
    const {
        logOnCreate: _logOnCreate,
        logOnRefresh: _logOnRefresh,
        ...publicDiagnosticsOptions
    } = diagnosticsOptions;

    return applyPublicAppIdentityDiagnosticsDefaults(
        publicDiagnosticsOptions,
        options.identity,
        options.routeMetadata
    );
}

function createLinkRoutedAppOptions<
    TRoute extends PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicLinkRoutedAppOptions<TRoute, TLocale, TKey>
): LinkRoutedAppOptions<TRoute, TLocale> {
    const {
        diagnostics: _diagnostics,
        identity,
        routeMetadata,
        ...linkRoutedAppOptions
    } = options;
    const routeDocumentMetadataOptions = createPublicAppRouteDocumentMetadataOptions(identity, routeMetadata);
    const nextOptions: LinkRoutedAppOptions<TRoute, TLocale> = {
        ...linkRoutedAppOptions
    };

    if (routeDocumentMetadataOptions !== undefined) {
        nextOptions.routeMetadata = routeDocumentMetadataOptions;
    }

    return nextOptions;
}

/**
 * Creates the public native-link/MPA recipe: LinkRoutedApp plus diagnostics defaults.
 */
export function createPublicLinkRoutedApp<
    TRoute extends PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
>(options: PublicLinkRoutedAppOptions<TRoute, TLocale, TKey>): PublicLinkRoutedApp<TRoute> {
    const routedApp = createLinkRoutedApp(createLinkRoutedAppOptions(options));
    const diagnostics = createPublicRoutedAppDiagnostics(routedApp, getDiagnosticsOptions(options));
    const publicApp: PublicLinkRoutedApp<TRoute> = {
        shell: routedApp.shell,
        routes: routedApp.routes,

        get diagnostics(): AppDiagnosticsRunner | null {
            return diagnostics;
        },

        getCurrentRoute(): TRoute | null {
            return routedApp.getCurrentRoute();
        },

        mount(target, mountOptions) {
            return routedApp.mount(target, mountOptions);
        },

        refresh(refreshOptions?: LinkRoutedAppRefreshOptions<TRoute>): void {
            routedApp.refresh(refreshOptions);

            if (shouldLogDiagnosticsOnRefresh(options)) {
                diagnostics?.log();
            }
        },

        refreshChrome(): void {
            routedApp.refreshChrome();
        },

        inspectDiagnostics(): AppDiagnosticsReport | null {
            return diagnostics?.inspect() ?? null;
        },

        logDiagnostics(): AppDiagnosticsReport | null {
            return diagnostics?.log() ?? null;
        },

        destroy(): void {
            routedApp.destroy();
        },

        isDestroyed(): boolean {
            return routedApp.isDestroyed();
        }
    };

    if (shouldLogDiagnosticsOnCreate(options)) {
        diagnostics?.log();
    }

    return publicApp;
}
