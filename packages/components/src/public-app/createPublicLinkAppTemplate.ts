import type { LocaleCode } from "../localization";
import {
    createLinkAppRouteChromeRenderer,
    type LinkAppRouteChromeBaseOptions,
    type LinkAppRouteChromeCreateHandler,
    type LinkAppRouteChromeOptionsResolver
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
    type PublicLinkRoutedAppRoute
} from "./createPublicLinkRoutedApp";
import {
    getPublicAppTemplateDiagnosticsOptions,
    getPublicAppTemplateShellOptions,
    resolvePublicAppTemplateRouteChromeOptions,
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
 * RouteChrome options accepted by createPublicLinkAppTemplate().
 */
export type PublicLinkAppTemplateRouteChromeOptions<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> =
    | LinkAppRouteChromeBaseOptions<TRoute, TLocale, TKey>
    | LinkAppRouteChromeOptionsResolver<TRoute, TLocale, TKey>;

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
 * Creates an opinionated public native-link or MPA app from shell, route chrome, diagnostics, locale, and metadata options.
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
        shell: _shell,
        ...publicAppOptions
    } = options;
    const appOptions: PublicLinkRoutedAppOptions<TRoute, TLocale, TKey> = {
        ...publicAppOptions,
        shell: getPublicAppTemplateShellOptions(options)
    };
    const diagnostics = getPublicAppTemplateDiagnosticsOptions<
        TLocale,
        TKey,
        PublicLinkRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute>
    >(options);
    const renderChrome = createTemplateRouteChromeRenderer(options);

    if (diagnostics !== undefined) {
        appOptions.diagnostics = diagnostics;
    }

    if (renderChrome !== undefined) {
        appOptions.renderChrome = renderChrome;
    }

    return createPublicLinkRoutedApp(appOptions);
}
