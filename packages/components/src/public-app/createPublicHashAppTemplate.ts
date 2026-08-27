import type { AppShellOptions, AppShellUpdateOptions } from "../app-shell";
import type { DocumentMetadataOptions, DocumentMetadataUpdateOptions } from "../document-metadata";
import type {
    LocaleCode,
    LocaleController,
    LocaleTextProvider
} from "../localization";
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

/**
 * Static value or lazy resolver accepted by public app templates.
 */
export type PublicHashAppTemplateValue<TValue> = TValue | (() => TValue);

/**
 * Initial metadata accepted by PublicHashAppTemplate shell options.
 */
export type PublicHashAppTemplateMetadata = DocumentMetadataOptions | false;

/**
 * Shell options accepted by createPublicHashAppTemplate().
 */
export interface PublicHashAppTemplateShellOptions extends Omit<
    AppShellOptions,
    "title" | "skipLink" | "navigationLabel" | "locale" | "metadata"
> {
    /** Document/app title, or a resolver re-read during locale refresh. */
    title?: PublicHashAppTemplateValue<AppShellOptions["title"]>;
    /** Skip-link text/setting, or a resolver re-read during locale refresh. */
    skipLink?: PublicHashAppTemplateValue<AppShellOptions["skipLink"]>;
    /** Navigation landmark label, or a resolver re-read during locale refresh. */
    navigationLabel?: PublicHashAppTemplateValue<AppShellOptions["navigationLabel"]>;
    /** Page fallback-text locale override. Defaults to the app locale when it exposes t(). */
    locale?: AppShellOptions["locale"];
    /** Initial metadata, or a resolver re-read during locale refresh. */
    metadata?: PublicHashAppTemplateValue<PublicHashAppTemplateMetadata>;
}

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

function resolveTemplateValue<TValue>(
    value: PublicHashAppTemplateValue<TValue> | undefined
): TValue | undefined {
    return typeof value === "function"
        ? (value as () => TValue)()
        : value;
}

function isLocaleTextProvider(value: unknown): value is LocaleTextProvider<string> {
    return Boolean(
        value
        && typeof value === "object"
        && "t" in value
        && typeof (value as LocaleTextProvider<string>).t === "function"
    );
}

function isLocaleController<
    TLocale extends LocaleCode,
    TKey extends string
>(value: unknown): value is LocaleController<TLocale, TKey> {
    return Boolean(
        value
        && typeof value === "object"
        && "getMessages" in value
        && typeof (value as LocaleController<TLocale, TKey>).getMessages === "function"
        && "has" in value
        && typeof (value as LocaleController<TLocale, TKey>).has === "function"
    );
}

function getShellLocale<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(options: PublicHashAppTemplateOptions<TRoute, TLocale, TKey>): AppShellOptions["locale"] | undefined {
    if (options.shell && "locale" in options.shell) return options.shell.locale;
    if (isLocaleTextProvider(options.locale)) return options.locale;

    return undefined;
}

function getTemplateShellOptions<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(options: PublicHashAppTemplateOptions<TRoute, TLocale, TKey>): AppShellOptions {
    const shellOptions = options.shell ?? {};
    const {
        title,
        skipLink,
        navigationLabel,
        locale: _locale,
        metadata,
        theme,
        ...baseShellOptions
    } = shellOptions;
    const shell: AppShellOptions = {
        ...baseShellOptions,
        mainId: baseShellOptions.mainId ?? "main",
        theme: theme ?? "system"
    };
    const shellLocale = getShellLocale(options);
    const resolvedTitle = resolveTemplateValue(title);
    const resolvedSkipLink = resolveTemplateValue(skipLink);
    const resolvedNavigationLabel = resolveTemplateValue(navigationLabel);
    const resolvedMetadata = resolveTemplateValue(metadata);

    if (resolvedTitle !== undefined) shell.title = resolvedTitle;
    if (resolvedSkipLink !== undefined) shell.skipLink = resolvedSkipLink;
    if (resolvedNavigationLabel !== undefined) shell.navigationLabel = resolvedNavigationLabel;
    if (shellLocale !== undefined) shell.locale = shellLocale;
    if (resolvedMetadata !== undefined) shell.metadata = resolvedMetadata;

    return shell;
}

function getTemplateShellUpdateOptions<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(options: PublicHashAppTemplateOptions<TRoute, TLocale, TKey>): AppShellUpdateOptions {
    const shellOptions = options.shell ?? {};
    const updateOptions: AppShellUpdateOptions = {};
    const shellLocale = getShellLocale(options);
    const resolvedTitle = resolveTemplateValue(shellOptions.title);
    const resolvedSkipLink = resolveTemplateValue(shellOptions.skipLink);
    const resolvedNavigationLabel = resolveTemplateValue(shellOptions.navigationLabel);
    const resolvedMetadata = resolveTemplateValue(shellOptions.metadata);

    if (resolvedTitle !== undefined) updateOptions.title = resolvedTitle;
    if (resolvedSkipLink !== undefined) updateOptions.skipLink = resolvedSkipLink;
    if (shellOptions.skipLinkTargetId !== undefined) updateOptions.skipLinkTargetId = shellOptions.skipLinkTargetId;
    if (resolvedNavigationLabel !== undefined) updateOptions.navigationLabel = resolvedNavigationLabel;
    if (shellLocale !== undefined) updateOptions.locale = shellLocale;
    if (resolvedMetadata !== undefined && resolvedMetadata !== false) {
        updateOptions.metadata = resolvedMetadata as DocumentMetadataUpdateOptions;
    }

    return updateOptions;
}

function hasTemplateShellUpdateOptions(options: AppShellUpdateOptions): boolean {
    return Object.keys(options).length > 0;
}

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
    if (!hasTemplateShellUpdateOptions(shellUpdateOptions) && routeChromeOptions.shell === undefined) {
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
                getTemplateShellUpdateOptions(options)
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

    if (diagnosticsOptions.locale !== undefined || !isLocaleController<TLocale, TKey>(options.locale)) {
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
        shell: getTemplateShellOptions(options)
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
