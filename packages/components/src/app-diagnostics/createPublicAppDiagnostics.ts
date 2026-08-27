import {
    createAppIdentityWebAppManifest,
    type AppIdentity,
    type AppIdentityWebAppManifestOptions
} from "../app-identity";
import {
    inspectPublicAppRoutes,
    type AppRouteDescriptor,
    type AppRouteDiagnosticsOptions,
    type AppRouteDiagnosticsReport
} from "../app-routes";
import {
    inspectLocaleController,
    type LocaleCode,
    type LocaleController,
    type LocaleControllerDiagnosticsOptions
} from "../localization";
import type {
    PageDiagnosticsDocumentMetadataOptions,
    PageDiagnosticsOptions,
    PageDiagnosticsReport
} from "../page";
import {
    inspectWebAppManifest,
    type WebAppManifest,
    type WebAppManifestDiagnosticsOptions
} from "../web-app-manifest";
import {
    createAppDiagnosticsRunner,
    type AppDiagnosticsRunner,
    type AppDiagnosticsRunnerLog,
    type AppDiagnosticsRunnerOptions,
    type AppDiagnosticsSourceOptions,
    type AppDiagnosticsSourcesResolver
} from "./createAppDiagnostics";

/**
 * Strict document metadata checks recommended for public apps and app-like sites.
 */
export const PUBLIC_APP_DOCUMENT_METADATA_DIAGNOSTICS: Readonly<PageDiagnosticsDocumentMetadataOptions> = Object.freeze({
    requireDescription: true,
    requireCanonical: true,
    requireRobots: true,
    requireManifest: true,
    requireOpenGraph: true,
    requireTwitter: true,
    requireStructuredData: true
});

/**
 * Strict web app manifest checks recommended for installable public apps.
 */
export const PUBLIC_APP_MANIFEST_DIAGNOSTICS: Readonly<WebAppManifestDiagnosticsOptions> = Object.freeze({
    requireShortName: true,
    requireDescription: true,
    requireStartUrl: true,
    requireDisplay: true,
    requireIcons: true,
    requireMaskableIcon: true,
    requireThemeColor: true,
    requireBackgroundColor: true
});

/**
 * Page-like object accepted by createPublicAppDiagnosticsRunner().
 */
export interface PublicAppDiagnosticsInspectablePage {
    inspect(options?: PageDiagnosticsOptions): PageDiagnosticsReport;
}

/**
 * Static value or lazy resolver accepted by public app diagnostics helpers.
 */
export type PublicAppDiagnosticsResolver<TValue> =
    | TValue
    | null
    | undefined
    | (() => TValue | null | undefined);

/**
 * Page diagnostics source accepted by createPublicAppDiagnosticsRunner().
 */
export type PublicAppDiagnosticsPageResolver = PublicAppDiagnosticsResolver<
    PublicAppDiagnosticsInspectablePage | PageDiagnosticsReport
>;

/**
 * Locale diagnostics source accepted by createPublicAppDiagnosticsRunner().
 */
export type PublicAppDiagnosticsLocaleResolver<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> = PublicAppDiagnosticsResolver<LocaleController<TLocale, TKey>>;

/**
 * Manifest diagnostics source accepted by createPublicAppDiagnosticsRunner().
 */
export type PublicAppDiagnosticsManifestResolver =
    | PublicAppDiagnosticsResolver<WebAppManifest>
    | false;

/**
 * App identity source accepted by createPublicAppDiagnosticsRunner().
 */
export type PublicAppDiagnosticsIdentityResolver = PublicAppDiagnosticsResolver<AppIdentity>;

/**
 * Route list or route diagnostics report accepted by createPublicAppDiagnosticsRunner().
 */
export type PublicAppDiagnosticsRoutesResolver<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = PublicAppDiagnosticsResolver<AppRouteDiagnosticsReport<TRoute> | readonly TRoute[]>;

/**
 * Options for createPublicAppDiagnosticsRunner().
 */
export interface PublicAppDiagnosticsRunnerOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string,
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    /** Page, AppShell, PageDiagnosticsReport, or lazy resolver used for the page source. */
    page?: PublicAppDiagnosticsPageResolver;
    /** Page diagnostics overrides merged on top of public-app metadata defaults. */
    pageOptions?: PageDiagnosticsOptions;
    /** App identity used to derive manifest diagnostics when manifest is not provided. */
    identity?: PublicAppDiagnosticsIdentityResolver;
    /** Manifest overrides used when manifest diagnostics are generated from identity. */
    identityManifestOptions?: AppIdentityWebAppManifestOptions;
    /** Route descriptors, route diagnostics report, or lazy resolver. Route lists use public-app diagnostics defaults. */
    routes?: PublicAppDiagnosticsRoutesResolver<TRoute>;
    /** Route diagnostics overrides used when routes is a route descriptor list. */
    routeOptions?: AppRouteDiagnosticsOptions<TRoute>;
    /** Locale controller or resolver used for the localization source. */
    locale?: PublicAppDiagnosticsLocaleResolver<TLocale, TKey>;
    /** Locale diagnostics options, such as required app and framework message keys. */
    localeOptions?: LocaleControllerDiagnosticsOptions<TLocale, TKey>;
    /** Web app manifest object or resolver used for the manifest source. */
    manifest?: PublicAppDiagnosticsManifestResolver;
    /** Manifest diagnostics overrides merged on top of public-app defaults. */
    manifestOptions?: WebAppManifestDiagnosticsOptions;
    /** Additional custom diagnostics sources. */
    sources?: AppDiagnosticsSourcesResolver;
    /** Logging behavior passed through to createAppDiagnosticsRunner(). */
    log?: AppDiagnosticsRunnerLog;
}

function resolvePublicAppDiagnosticsValue<TValue>(
    resolver: PublicAppDiagnosticsResolver<TValue>
): TValue | null {
    if (typeof resolver === "function") {
        const resolve = resolver as () => TValue | null | undefined;

        return resolve() ?? null;
    }

    return resolver ?? null;
}

function resolvePublicAppDiagnosticsSources(
    resolver: AppDiagnosticsSourcesResolver
): readonly AppDiagnosticsSourceOptions[] {
    const sources = typeof resolver === "function"
        ? resolver()
        : resolver;

    return sources ?? [];
}

function isInspectablePage(value: unknown): value is PublicAppDiagnosticsInspectablePage {
    return Boolean(
        value
        && typeof value === "object"
        && "inspect" in value
        && typeof (value as PublicAppDiagnosticsInspectablePage).inspect === "function"
    );
}

function resolvePublicAppPageReport(
    page: PublicAppDiagnosticsPageResolver,
    pageOptions: PageDiagnosticsOptions | undefined
): PageDiagnosticsReport | null {
    const resolvedPage = resolvePublicAppDiagnosticsValue(page);

    if (!resolvedPage) return null;
    if (!isInspectablePage(resolvedPage)) return resolvedPage;

    return resolvedPage.inspect(createPublicAppPageDiagnosticsOptions(pageOptions));
}

function isPublicAppDiagnosticsRouteList<TRoute extends AppRouteDescriptor>(
    value: AppRouteDiagnosticsReport<TRoute> | readonly TRoute[]
): value is readonly TRoute[] {
    return Array.isArray(value);
}

function resolvePublicAppRouteReport<TRoute extends AppRouteDescriptor>(
    routes: PublicAppDiagnosticsRoutesResolver<TRoute>,
    routeOptions: AppRouteDiagnosticsOptions<TRoute> | undefined
): AppRouteDiagnosticsReport<TRoute> | null {
    const resolvedRoutes = resolvePublicAppDiagnosticsValue(routes);

    if (!resolvedRoutes) return null;
    if (isPublicAppDiagnosticsRouteList(resolvedRoutes)) {
        return inspectPublicAppRoutes(resolvedRoutes, routeOptions);
    }

    return resolvedRoutes;
}

function resolvePublicAppManifest(
    manifest: PublicAppDiagnosticsManifestResolver,
    identity: AppIdentity | null,
    identityManifestOptions: AppIdentityWebAppManifestOptions | undefined
): WebAppManifest | null {
    if (manifest === false) return null;
    if (manifest !== undefined) return resolvePublicAppDiagnosticsValue(manifest);
    if (!identity) return null;

    return createAppIdentityWebAppManifest(identity, identityManifestOptions);
}

function createPublicAppDiagnosticSources<
    TLocale extends LocaleCode,
    TKey extends string,
    TRoute extends AppRouteDescriptor
>(
    options: PublicAppDiagnosticsRunnerOptions<TLocale, TKey, TRoute>
): readonly AppDiagnosticsSourceOptions[] {
    const sources: AppDiagnosticsSourceOptions[] = [];
    const locale = resolvePublicAppDiagnosticsValue(options.locale);
    const identity = resolvePublicAppDiagnosticsValue(options.identity);
    const manifest = resolvePublicAppManifest(
        options.manifest,
        identity,
        options.identityManifestOptions
    );

    if (locale) {
        sources.push({
            id: "localization",
            label: "Localization",
            report: inspectLocaleController(locale, options.localeOptions)
        });
    }

    if (manifest) {
        sources.push({
            id: "manifest",
            label: "Web App Manifest",
            report: inspectWebAppManifest(
                manifest,
                createPublicAppManifestDiagnosticsOptions(options.manifestOptions)
            )
        });
    }

    sources.push(...resolvePublicAppDiagnosticsSources(options.sources));

    return sources;
}

/**
 * Creates page diagnostics options with public-app document metadata requirements enabled.
 */
export function createPublicAppPageDiagnosticsOptions(
    options: PageDiagnosticsOptions = {}
): PageDiagnosticsOptions {
    return {
        ...options,
        log: options.log ?? false,
        documentMetadata: {
            ...PUBLIC_APP_DOCUMENT_METADATA_DIAGNOSTICS,
            ...(options.documentMetadata ?? {})
        }
    };
}

/**
 * Creates web app manifest diagnostics options with public-app requirements enabled.
 */
export function createPublicAppManifestDiagnosticsOptions(
    options: WebAppManifestDiagnosticsOptions = {}
): WebAppManifestDiagnosticsOptions {
    return {
        ...PUBLIC_APP_MANIFEST_DIAGNOSTICS,
        ...options
    };
}

/**
 * Creates a diagnostics runner for public apps that need page, route, locale, and manifest health checks.
 */
export function createPublicAppDiagnosticsRunner<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string,
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
>(
    options: PublicAppDiagnosticsRunnerOptions<TLocale, TKey, TRoute> = {}
): AppDiagnosticsRunner {
    const runnerOptions: AppDiagnosticsRunnerOptions = {
        sources: () => createPublicAppDiagnosticSources(options)
    };

    if (options.page !== undefined) {
        runnerOptions.page = () => resolvePublicAppPageReport(options.page, options.pageOptions);
    }

    if (options.routes !== undefined) {
        runnerOptions.routes = () => resolvePublicAppRouteReport(
            options.routes,
            options.routeOptions
        );
    }

    if (options.log !== undefined) runnerOptions.log = options.log;

    return createAppDiagnosticsRunner(runnerOptions);
}
