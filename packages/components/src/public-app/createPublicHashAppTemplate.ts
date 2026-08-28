import type { LocaleCode } from "../localization";
import {
    createHashAppRouteChromeRenderer,
    type HashAppRouteChromeBaseOptions,
    type HashAppRouteChromeCreateHandler
} from "../route-chrome";
import type {
    HashRoutedAppChromeRenderer,
    HashRoutedAppContext
} from "../routed-app";
import type { HashRouterNavigateOptions } from "../routing";
import {
    createPublicHashRoutedApp,
    type PublicHashRoutedApp,
    type PublicHashRoutedAppDiagnosticsOptions,
    type PublicHashRoutedAppOptions,
    type PublicHashRoutedAppRoute,
    type PublicHashRoutedAppRouteMetadataOptions
} from "./createPublicHashRoutedApp";
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
 * Static value or lazy resolver accepted by public hash app templates.
 */
export type PublicHashAppTemplateValue<TValue> = SharedPublicAppTemplateValue<TValue>;

/**
 * Initial metadata accepted by PublicHashAppTemplate shell options.
 */
export type PublicHashAppTemplateMetadata = SharedPublicAppTemplateMetadata;

/**
 * Shell options accepted by createPublicHashAppTemplate().
 */
export interface PublicHashAppTemplateShellOptions extends SharedPublicAppTemplateShellOptions {}

/**
 * Localized route text bundle accepted by createPublicHashAppTemplate() for metadata,
 * route chrome, and route announcements.
 */
export type PublicHashAppTemplateRouteText<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute
> = SharedPublicAppTemplateRouteText<TRoute>;

/**
 * RouteChrome options accepted by createPublicHashAppTemplate() before routes are injected.
 */
export type PublicHashAppTemplateRouteChromeBaseOptions<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> = SharedPublicAppTemplateRouteChromeBaseOptions<TRoute, HashAppRouteChromeBaseOptions<TRoute, TLocale, TKey>>;

/**
 * Lazy RouteChrome options resolver accepted by createPublicHashAppTemplate().
 */
export type PublicHashAppTemplateRouteChromeOptionsResolver<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> = (
    context: HashRoutedAppContext<TRoute>
) => PublicHashAppTemplateRouteChromeBaseOptions<TRoute, TLocale, TKey>;

/**
 * RouteChrome options accepted by createPublicHashAppTemplate().
 */
export type PublicHashAppTemplateRouteChromeOptions<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> =
    | PublicHashAppTemplateRouteChromeBaseOptions<TRoute, TLocale, TKey>
    | PublicHashAppTemplateRouteChromeOptionsResolver<TRoute, TLocale, TKey>;

/**
 * Options for createPublicHashAppTemplate(), the first high-level public SPA template.
 */
export interface PublicHashAppTemplateOptions<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> extends Omit<PublicHashRoutedAppOptions<TRoute, TLocale, TKey>, "shell" | "renderChrome"> {
    /** AppShell settings with template defaults and locale-refresh support. */
    shell?: PublicHashAppTemplateShellOptions;
    /** Localized route text defaults for route metadata, route chrome, and SPA route-loaded announcements. */
    routeText?: PublicHashAppTemplateRouteText<TRoute> | false;
    /** Declarative RouteChrome options, or false to omit managed route chrome. */
    routeChrome?: PublicHashAppTemplateRouteChromeOptions<TRoute, TLocale, TKey> | false;
    /** Optional hook called after the template creates RouteChrome. */
    onRouteChromeCreate?: HashAppRouteChromeCreateHandler<TRoute, TLocale> | null;
}

/**
 * Runtime controller returned by createPublicHashAppTemplate().
 */
export type PublicHashAppTemplate<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute
> = PublicHashRoutedApp<TRoute>;

const defaultStartOptions: HashRouterNavigateOptions = {
    announcement: false,
    scroll: false,
    focusTarget: null
};

function getTemplateRouteMetadata<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicHashAppTemplateOptions<TRoute, TLocale, TKey>
): PublicHashRoutedAppRouteMetadataOptions<TRoute> | undefined {
    return getPublicAppTemplateRouteMetadata(options.routeMetadata, options.routeText);
}

function getTemplateRouterOptions<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicHashAppTemplateOptions<TRoute, TLocale, TKey>
): PublicHashRoutedAppOptions<TRoute, TLocale, TKey>["router"] | undefined {
    const routerOptions = options.router;
    const routeText = options.routeText;

    if (!routeText || routerOptions?.getAnnouncement !== undefined) return routerOptions;

    return {
        ...(routerOptions ?? {}),
        getAnnouncement: routeText.getLoadedAnnouncement
    };
}

function createTemplateRouteChromeRenderer<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicHashAppTemplateOptions<TRoute, TLocale, TKey>
): HashRoutedAppChromeRenderer<TRoute> | undefined {
    const routeChrome = options.routeChrome;

    if (routeChrome === undefined || routeChrome === false) return undefined;

    const rendererOptions = {
        options(context: HashRoutedAppContext<TRoute>): HashAppRouteChromeBaseOptions<TRoute, TLocale, TKey> {
            return resolvePublicAppTemplateRouteChromeOptions(routeChrome, context, options);
        }
    };

    if (options.onRouteChromeCreate !== undefined) {
        return createHashAppRouteChromeRenderer<TRoute, TLocale, TKey>({
            ...rendererOptions,
            onCreate: options.onRouteChromeCreate
        });
    }

    return createHashAppRouteChromeRenderer<TRoute, TLocale, TKey>(rendererOptions);
}

/**
 * Creates an opinionated public hash-routed SPA from shell, route chrome, diagnostics, locale, and metadata options.
 */
export function createPublicHashAppTemplate<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
>(options: PublicHashAppTemplateOptions<TRoute, TLocale, TKey>): PublicHashAppTemplate<TRoute> {
    const {
        diagnostics: _diagnostics,
        onRouteChromeCreate: _onRouteChromeCreate,
        routeChrome: _routeChrome,
        routeMetadata: _routeMetadata,
        routeText: _routeText,
        router: _router,
        shell: _shell,
        startOptions,
        ...publicAppOptions
    } = options;
    const appOptions: PublicHashRoutedAppOptions<TRoute, TLocale, TKey> = {
        ...publicAppOptions,
        shell: getPublicAppTemplateShellOptions(options)
    };
    const routeMetadata = getTemplateRouteMetadata(options);
    const router = getTemplateRouterOptions(options);
    const diagnostics = getPublicAppTemplateDiagnosticsOptions<
        TLocale,
        TKey,
        PublicHashRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute>
    >(options);
    const renderChrome = createTemplateRouteChromeRenderer(options);

    if (routeMetadata !== undefined) {
        appOptions.routeMetadata = routeMetadata;
    }

    if (router !== undefined) {
        appOptions.router = router;
    }

    if (diagnostics !== undefined) {
        appOptions.diagnostics = diagnostics;
    }

    if (renderChrome !== undefined) {
        appOptions.renderChrome = renderChrome;
    }

    appOptions.startOptions = startOptions ?? defaultStartOptions;

    return createPublicHashRoutedApp(appOptions);
}
