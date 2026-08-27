import type { AppShellUpdateOptions } from "../app-shell";
import type { LocaleCode } from "../localization";
import {
    createHashAppRouteChromeRenderer,
    type HashAppRouteChromeBaseOptions,
    type HashAppRouteChromeCreateHandler,
    type HashAppRouteChromeOptionsResolver
} from "../route-chrome";
import type {
    HashRoutedAppChromeRenderer,
    HashRoutedAppContext
} from "../routed-app";
import type { HashRouterNavigateOptions } from "../routing";
import {
    createPublicHashRoutedApp,
    type PublicHashRoutedApp,
    type PublicHashRoutedAppOptions,
    type PublicHashRoutedAppRoute
} from "./createPublicHashRoutedApp";
import {
    getPublicAppTemplateShellOptions,
    getPublicAppTemplateShellUpdateOptions,
    hasPublicAppTemplateShellUpdateOptions,
    isPublicAppTemplateLocaleController,
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
 * RouteChrome options accepted by createPublicHashAppTemplate().
 */
export type PublicHashAppTemplateRouteChromeOptions<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> =
    | HashAppRouteChromeBaseOptions<TRoute, TLocale, TKey>
    | HashAppRouteChromeOptionsResolver<TRoute, TLocale, TKey>;

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

function resolveRouteChromeOptions<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    routeChrome: PublicHashAppTemplateRouteChromeOptions<TRoute, TLocale, TKey>,
    context: HashRoutedAppContext<TRoute>
): HashAppRouteChromeBaseOptions<TRoute, TLocale, TKey> {
    return typeof routeChrome === "function"
        ? routeChrome(context)
        : routeChrome;
}

function withTemplateShellUpdate<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    routeChromeOptions: HashAppRouteChromeBaseOptions<TRoute, TLocale, TKey>,
    shellUpdateOptions: AppShellUpdateOptions
): HashAppRouteChromeBaseOptions<TRoute, TLocale, TKey> {
    if (!hasPublicAppTemplateShellUpdateOptions(shellUpdateOptions) && routeChromeOptions.shell === undefined) {
        return routeChromeOptions;
    }

    return {
        ...routeChromeOptions,
        shell: {
            ...shellUpdateOptions,
            ...(routeChromeOptions.shell ?? {})
        }
    };
}

function createTemplateRouteChromeRenderer<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicHashAppTemplateOptions<TRoute, TLocale, TKey>
): HashRoutedAppChromeRenderer<TRoute> | undefined {
    if (options.routeChrome === undefined || options.routeChrome === false) return undefined;

    const rendererOptions = {
        options(context: HashRoutedAppContext<TRoute>): HashAppRouteChromeBaseOptions<TRoute, TLocale, TKey> {
            return withTemplateShellUpdate(
                resolveRouteChromeOptions(options.routeChrome as PublicHashAppTemplateRouteChromeOptions<TRoute, TLocale, TKey>, context),
                getPublicAppTemplateShellUpdateOptions(options)
            );
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

function getTemplateDiagnosticsOptions<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicHashAppTemplateOptions<TRoute, TLocale, TKey>
): PublicHashRoutedAppOptions<TRoute, TLocale, TKey>["diagnostics"] {
    if (options.diagnostics === false) return false;

    const diagnosticsOptions = options.diagnostics ?? {};

    if (diagnosticsOptions.locale !== undefined || !isPublicAppTemplateLocaleController<TLocale, TKey>(options.locale)) {
        return diagnosticsOptions;
    }

    return {
        ...diagnosticsOptions,
        locale: options.locale
    };
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
        shell: _shell,
        startOptions,
        ...publicAppOptions
    } = options;
    const appOptions: PublicHashRoutedAppOptions<TRoute, TLocale, TKey> = {
        ...publicAppOptions,
        shell: getPublicAppTemplateShellOptions(options)
    };
    const diagnostics = getTemplateDiagnosticsOptions(options);
    const renderChrome = createTemplateRouteChromeRenderer(options);

    if (diagnostics !== undefined) {
        appOptions.diagnostics = diagnostics;
    }

    if (renderChrome !== undefined) {
        appOptions.renderChrome = renderChrome;
    }

    appOptions.startOptions = startOptions ?? defaultStartOptions;

    return createPublicHashRoutedApp(appOptions);
}
