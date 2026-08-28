import type { LocaleCode } from "../localization";
import {
    createLinkAppRouteChromeRenderer,
    type LinkAppRouteChromeBaseOptions,
    type LinkAppRouteChromeCreateHandler
} from "../route-chrome";
import type {
    LinkRoutedAppChromeRenderer,
    LinkRoutedAppContext
} from "../routed-app";
import {
    createPublicLinkRoutedApp,
    type PublicLinkRoutedApp,
    type PublicLinkRoutedAppDiagnosticsOptions,
    type PublicLinkRoutedAppOptions,
    type PublicLinkRoutedAppRoute,
    type PublicLinkRoutedAppRouteMetadataOptions
} from "./createPublicLinkRoutedApp";
import {
    getPublicAppTemplateDiagnosticsOptions,
    getPublicAppTemplateRouteMetadata,
    getPublicAppTemplateShellOptions,
    resolvePublicAppTemplateRouteChromeOptions,
    type PublicAppTemplateRouteChromeBaseOptions as SharedPublicAppTemplateRouteChromeBaseOptions,
    type PublicAppTemplateRouteText as SharedPublicAppTemplateRouteText,
    type PublicAppTemplateMetadata as SharedPublicAppTemplateMetadata,
    type PublicAppTemplateShellOptions as SharedPublicAppTemplateShellOptions,
    type PublicAppTemplateValue as SharedPublicAppTemplateValue
} from "./publicAppTemplateInternals";

/**
 * Static value or lazy resolver accepted by public native-link app templates.
 */
export type PublicLinkAppTemplateValue<TValue> = SharedPublicAppTemplateValue<TValue>;

/**
 * Initial metadata accepted by PublicLinkAppTemplate shell options.
 */
export type PublicLinkAppTemplateMetadata = SharedPublicAppTemplateMetadata;

/**
 * Shell options accepted by createPublicLinkAppTemplate().
 */
export interface PublicLinkAppTemplateShellOptions extends SharedPublicAppTemplateShellOptions {}

/**
 * Localized route text bundle accepted by createPublicLinkAppTemplate() for metadata and route chrome.
 */
export type PublicLinkAppTemplateRouteText<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute
> = SharedPublicAppTemplateRouteText<TRoute>;

/**
 * RouteChrome options accepted by createPublicLinkAppTemplate() before routes are injected.
 */
export type PublicLinkAppTemplateRouteChromeBaseOptions<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> = SharedPublicAppTemplateRouteChromeBaseOptions<TRoute, LinkAppRouteChromeBaseOptions<TRoute, TLocale, TKey>>;

/**
 * Lazy RouteChrome options resolver accepted by createPublicLinkAppTemplate().
 */
export type PublicLinkAppTemplateRouteChromeOptionsResolver<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> = (
    context: LinkRoutedAppContext<TRoute>
) => PublicLinkAppTemplateRouteChromeBaseOptions<TRoute, TLocale, TKey>;

/**
 * RouteChrome options accepted by createPublicLinkAppTemplate().
 */
export type PublicLinkAppTemplateRouteChromeOptions<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> =
    | PublicLinkAppTemplateRouteChromeBaseOptions<TRoute, TLocale, TKey>
    | PublicLinkAppTemplateRouteChromeOptionsResolver<TRoute, TLocale, TKey>;

/**
 * Options for createPublicLinkAppTemplate(), the high-level public native-link/MPA template.
 */
export interface PublicLinkAppTemplateOptions<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> extends Omit<PublicLinkRoutedAppOptions<TRoute, TLocale, TKey>, "shell" | "renderChrome"> {
    /** AppShell settings with template defaults and locale-refresh support. */
    shell?: PublicLinkAppTemplateShellOptions;
    /** Localized route text defaults for route metadata and route chrome. */
    routeText?: PublicLinkAppTemplateRouteText<TRoute> | false;
    /** Declarative RouteChrome options, or false to omit managed route chrome. */
    routeChrome?: PublicLinkAppTemplateRouteChromeOptions<TRoute, TLocale, TKey> | false;
    /** Optional hook called after the template creates RouteChrome. */
    onRouteChromeCreate?: LinkAppRouteChromeCreateHandler<TRoute, TLocale> | null;
}

/**
 * Runtime controller returned by createPublicLinkAppTemplate().
 */
export type PublicLinkAppTemplate<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute
> = PublicLinkRoutedApp<TRoute>;

function getTemplateRouteMetadata<
    TRoute extends PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicLinkAppTemplateOptions<TRoute, TLocale, TKey>
): PublicLinkRoutedAppRouteMetadataOptions<TRoute> | undefined {
    return getPublicAppTemplateRouteMetadata(options.routeMetadata, options.routeText);
}

function createTemplateRouteChromeRenderer<
    TRoute extends PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicLinkAppTemplateOptions<TRoute, TLocale, TKey>
): LinkRoutedAppChromeRenderer<TRoute> | undefined {
    const routeChrome = options.routeChrome;

    if (routeChrome === undefined || routeChrome === false) return undefined;

    const rendererOptions = {
        options(context: LinkRoutedAppContext<TRoute>): LinkAppRouteChromeBaseOptions<TRoute, TLocale, TKey> {
            return resolvePublicAppTemplateRouteChromeOptions(routeChrome, context, options);
        }
    };

    if (options.onRouteChromeCreate !== undefined) {
        return createLinkAppRouteChromeRenderer<TRoute, TLocale, TKey>({
            ...rendererOptions,
            onCreate: options.onRouteChromeCreate
        });
    }

    return createLinkAppRouteChromeRenderer<TRoute, TLocale, TKey>(rendererOptions);
}

/**
 * Creates an opinionated public native-link or MPA app from shell, route chrome,
 * diagnostics, locale, and metadata options.
 */
export function createPublicLinkAppTemplate<
    TRoute extends PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
>(options: PublicLinkAppTemplateOptions<TRoute, TLocale, TKey>): PublicLinkAppTemplate<TRoute> {
    const {
        diagnostics: _diagnostics,
        onRouteChromeCreate: _onRouteChromeCreate,
        routeChrome: _routeChrome,
        routeMetadata: _routeMetadata,
        routeText: _routeText,
        shell: _shell,
        ...publicAppOptions
    } = options;
    const appOptions: PublicLinkRoutedAppOptions<TRoute, TLocale, TKey> = {
        ...publicAppOptions,
        shell: getPublicAppTemplateShellOptions(options)
    };
    const routeMetadata = getTemplateRouteMetadata(options);
    const diagnostics = getPublicAppTemplateDiagnosticsOptions<
        TLocale,
        TKey,
        PublicLinkRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute>
    >(options);
    const renderChrome = createTemplateRouteChromeRenderer(options);

    if (routeMetadata !== undefined) {
        appOptions.routeMetadata = routeMetadata;
    }

    if (diagnostics !== undefined) {
        appOptions.diagnostics = diagnostics;
    }

    if (renderChrome !== undefined) {
        appOptions.renderChrome = renderChrome;
    }

    return createPublicLinkRoutedApp(appOptions);
}
