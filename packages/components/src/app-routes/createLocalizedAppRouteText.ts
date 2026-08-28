import type {
    LocaleMessageParams,
    LocaleTextProvider
} from "../localization";
import {
    getAppRouteDescription,
    getAppRouteLabel,
    type AppRouteBreadcrumbItemsOptions,
    type AppRouteDescriptor,
    type AppRouteDiagnosticsOptions,
    type AppRouteDocumentMetadataOptions,
    type AppRouteNavigationItemsOptions,
    type AppRouteSearchItemsOptions
} from "./createAppRouteItems";

/**
 * Locale message keys attached to a route descriptor.
 */
export interface AppRouteLocaleTextKeys<TKey extends string = string> {
    /** Message key for the route title. Falls back to route.title. */
    title?: TKey | null;
    /** Message key for the short navigation/breadcrumb label. Falls back to route.label or route.title. */
    label?: TKey | null;
    /** Message key for route descriptions used by search, metadata, and diagnostics. */
    description?: TKey | null;
    /** Message key for route navigation hints. Falls back to route.hint. */
    hint?: TKey | null;
    /** Message key for the document title. Falls back to route.documentTitle or the localized route title. */
    documentTitle?: TKey | null;
    /** Extra searchable message keys for route search and command palettes. */
    keywords?: readonly TKey[] | null;
}

/**
 * Optional route extension read by createLocalizedAppRouteText().
 */
export interface AppRouteLocaleTextRoute<TKey extends string = string> {
    /** Localized text keys owned by the application route. */
    localeKeys?: AppRouteLocaleTextKeys<TKey> | null;
}

/**
 * Resolves locale message keys for a route.
 */
export type AppRouteLocaleTextKeysResolver<
    TRoute extends AppRouteDescriptor,
    TKey extends string = string
> = (route: TRoute) => AppRouteLocaleTextKeys<TKey> | null | undefined;

/**
 * Resolves interpolation params for route-localized messages.
 */
export type AppRouteLocaleTextParamsResolver<
    TRoute extends AppRouteDescriptor
> = (route: TRoute) => LocaleMessageParams | null | undefined;

/**
 * Options for createLocalizedAppRouteText().
 */
export interface LocalizedAppRouteTextOptions<
    TRoute extends AppRouteDescriptor,
    TKey extends string = string
> {
    /** Locale provider used to translate application-owned route text keys. */
    locale: LocaleTextProvider<TKey>;
    /** Custom key resolver. Defaults to route.localeKeys. */
    getKeys?: AppRouteLocaleTextKeysResolver<TRoute, TKey>;
    /** Optional params merged with default route params for every localized message. */
    getParams?: AppRouteLocaleTextParamsResolver<TRoute>;
}

/**
 * Combined route metadata and diagnostics resolvers generated from localized route text.
 */
export type LocalizedAppRouteTextRouteOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = Pick<
    AppRouteDocumentMetadataOptions<TRoute>,
    "getTitle" | "getDescription"
> & Pick<
    AppRouteDiagnosticsOptions<TRoute>,
    "getDocumentTitle"
>;

/**
 * Localized route text resolvers and ready-to-pass route helper options.
 */
export interface LocalizedAppRouteText<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    /** Returns the localized route title, falling back to route.title. */
    getTitle(route: TRoute): string;
    /** Returns the localized navigation/breadcrumb label. */
    getLabel(route: TRoute): string;
    /** Returns the localized route description, or null when no description exists. */
    getDescription(route: TRoute): string | null;
    /** Returns the localized route hint, or null when no hint exists. */
    getHint(route: TRoute): string | null;
    /** Returns the localized document title, or null when document title is disabled. */
    getDocumentTitle(route: TRoute): string | null;
    /** Returns localized route keywords for search and command palettes. */
    getKeywords(route: TRoute): string[];
    /** Navigation item resolvers using localized route text. */
    readonly navigationItemsOptions: AppRouteNavigationItemsOptions<TRoute>;
    /** Search item resolvers using localized route text. */
    readonly searchItemsOptions: AppRouteSearchItemsOptions<TRoute>;
    /** Breadcrumb item resolvers using localized route text. */
    readonly breadcrumbItemsOptions: AppRouteBreadcrumbItemsOptions<TRoute>;
    /** Combined metadata and diagnostics resolvers using localized route text. */
    readonly routeOptions: LocalizedAppRouteTextRouteOptions<TRoute>;
    /** Document metadata resolvers using localized route text. */
    readonly documentMetadataOptions: Pick<
        AppRouteDocumentMetadataOptions<TRoute>,
        "getTitle" | "getDescription"
    >;
    /** Diagnostics resolvers using localized route text. */
    readonly diagnosticsOptions: Pick<
        AppRouteDiagnosticsOptions<TRoute>,
        "getDocumentTitle" | "getDescription"
    >;
}

type LocaleTextProviderWithHas<TKey extends string> = LocaleTextProvider<TKey> & {
    has?(key: TKey, locale?: string | null): boolean;
};

function getDefaultRouteLocaleTextKeys<
    TRoute extends AppRouteDescriptor,
    TKey extends string
>(route: TRoute): AppRouteLocaleTextKeys<TKey> | null {
    if (!("localeKeys" in route)) return null;

    return (route as TRoute & AppRouteLocaleTextRoute<TKey>).localeKeys ?? null;
}

function getDefaultRouteParams<TRoute extends AppRouteDescriptor>(route: TRoute): LocaleMessageParams {
    return {
        id: route.id,
        label: getAppRouteLabel(route),
        title: route.title
    };
}

function getDocumentTitleFallback<TRoute extends AppRouteDescriptor>(
    route: TRoute,
    getTitle: (route: TRoute) => string
): string | null {
    if ("documentTitle" in route) {
        if (route.documentTitle === null) return null;
        if (route.documentTitle !== undefined) return route.documentTitle;
    }

    return getTitle(route);
}

function resolveRouteParams<
    TRoute extends AppRouteDescriptor,
    TKey extends string
>(
    route: TRoute,
    options: LocalizedAppRouteTextOptions<TRoute, TKey>
): LocaleMessageParams {
    return {
        ...getDefaultRouteParams(route),
        ...(options.getParams?.(route) ?? {})
    };
}

function hasLocaleText<TKey extends string>(
    locale: LocaleTextProvider<TKey>,
    key: TKey
): boolean {
    const candidate = locale as LocaleTextProviderWithHas<TKey>;

    return typeof candidate.has === "function" ? candidate.has(key) : true;
}

function normalizeResolvedText(value: string): string | null {
    const text = value.trim();

    return text.length > 0 ? text : null;
}

function resolveLocalizedText<TKey extends string>(
    locale: LocaleTextProvider<TKey>,
    key: TKey | null | undefined,
    fallback: string | null,
    params: LocaleMessageParams
): string | null {
    if (!key || !hasLocaleText(locale, key)) return fallback;

    const text = normalizeResolvedText(locale.t(key, params));

    return text !== null && text !== key ? text : fallback;
}

function uniqueText(values: Array<string | null | undefined>): string[] {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

/**
 * Creates localized route text resolvers from route.localeKeys and one locale provider.
 */
export function createLocalizedAppRouteText<
    TRoute extends AppRouteDescriptor,
    TKey extends string = string
>(options: LocalizedAppRouteTextOptions<TRoute, TKey>): LocalizedAppRouteText<TRoute> {
    const getKeys = options.getKeys ?? getDefaultRouteLocaleTextKeys<TRoute, TKey>;

    function getRouteKeys(route: TRoute): AppRouteLocaleTextKeys<TKey> | null {
        return getKeys(route) ?? null;
    }

    function getTitle(route: TRoute): string {
        const params = resolveRouteParams(route, options);

        return resolveLocalizedText(options.locale, getRouteKeys(route)?.title, route.title, params) ?? route.title;
    }

    function getLabel(route: TRoute): string {
        const params = resolveRouteParams(route, options);
        const fallback = route.label ?? getTitle(route);

        return resolveLocalizedText(options.locale, getRouteKeys(route)?.label, fallback, params) ?? fallback;
    }

    function getDescription(route: TRoute): string | null {
        const params = resolveRouteParams(route, options);

        return resolveLocalizedText(
            options.locale,
            getRouteKeys(route)?.description,
            getAppRouteDescription(route),
            params
        );
    }

    function getHint(route: TRoute): string | null {
        const params = resolveRouteParams(route, options);
        const fallback = route.hint ?? null;

        return resolveLocalizedText(options.locale, getRouteKeys(route)?.hint, fallback, params);
    }

    function getDocumentTitle(route: TRoute): string | null {
        const params = resolveRouteParams(route, options);
        const fallback = getDocumentTitleFallback(route, getTitle);

        return resolveLocalizedText(options.locale, getRouteKeys(route)?.documentTitle, fallback, params);
    }

    function getKeywords(route: TRoute): string[] {
        const keys = getRouteKeys(route)?.keywords ?? [];
        const params = resolveRouteParams(route, options);
        const localizedKeywords = keys.map((key) => resolveLocalizedText(options.locale, key, null, params));

        return uniqueText([
            getTitle(route),
            getLabel(route),
            getDescription(route),
            getHint(route),
            ...localizedKeywords
        ]);
    }

    return {
        getTitle,
        getLabel,
        getDescription,
        getHint,
        getDocumentTitle,
        getKeywords,
        navigationItemsOptions: {
            getLabel,
            getHint
        },
        searchItemsOptions: {
            getLabel,
            getDescription,
            getKeywords
        },
        breadcrumbItemsOptions: {
            getLabel
        },
        routeOptions: {
            getTitle: getDocumentTitle,
            getDocumentTitle,
            getDescription
        },
        documentMetadataOptions: {
            getTitle: getDocumentTitle,
            getDescription
        },
        diagnosticsOptions: {
            getDocumentTitle,
            getDescription
        }
    };
}
