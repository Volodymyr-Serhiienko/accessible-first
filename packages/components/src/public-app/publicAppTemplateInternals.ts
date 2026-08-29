import type { PublicAppDiagnosticsLocaleResolver } from "../app-diagnostics";
import type {
    AppRouteDescriptor,
    LocalizedAppRouteText
} from "../app-routes";
import {
    createAppIdentityDocumentMetadata,
    type AppIdentity
} from "../app-identity";
import type { AppRouteChromeHeaderOptions } from "../route-chrome";
import type {
    AppShellOptions,
    AppShellOutletOptions,
    AppShellUpdateOptions
} from "../app-shell";
import type { DocumentMetadataOptions, DocumentMetadataUpdateOptions } from "../document-metadata";
import type {
    LocaleCode,
    LocaleController,
    LocaleTextProvider
} from "../localization";

/**
 * Localized route text bundle accepted by public app templates for metadata, route chrome, and route announcements.
 */
export type PublicAppTemplateRouteText<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = Pick<
    LocalizedAppRouteText<TRoute>,
    | "routeOptions"
    | "getLoadedAnnouncement"
    | "navigationItemsOptions"
    | "searchItemsOptions"
    | "breadcrumbItemsOptions"
>;

/**
 * Route text defaults safe to inject into route chrome controls.
 */
export type PublicAppTemplateRouteChromeRouteText<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = Partial<Pick<
    PublicAppTemplateRouteText<TRoute>,
    "navigationItemsOptions" | "searchItemsOptions" | "breadcrumbItemsOptions"
>>;

/**
 * Static value or zero-argument resolver accepted by public app templates.
 */
export type PublicAppTemplateValue<TValue> = TValue | (() => TValue);

/**
 * Static value or context-aware resolver accepted by public app template internals.
 */
export type PublicAppTemplateContextValue<TValue, TContext> = TValue | ((context: TContext) => TValue);

/**
 * Initial metadata accepted by public app template shell options.
 */
export type PublicAppTemplateMetadata = DocumentMetadataOptions | false;

/**
 * Route chrome options accepted by public app templates before the template injects its route list.
 */
export type PublicAppTemplateRouteChromeBaseOptions<
    TRoute,
    TOptions extends { routes: readonly TRoute[] }
> = Omit<TOptions, "routes"> & {
    /** Optional route override. Omit it to use the public app template route list. */
    routes?: readonly TRoute[];
};

/**
 * Enables the standard public app route chrome recipe with framework defaults.
 */
export type PublicAppTemplateDefaultRouteChrome = true;

/**
 * Common shell options accepted by public app templates.
 */
export interface PublicAppTemplateShellOptions extends Omit<
    AppShellOptions,
    "title" | "skipLink" | "navigationLabel" | "locale" | "metadata" | "outletOptions"
> {
    /** Document/app title, or a resolver re-read during locale refresh. */
    title?: PublicAppTemplateValue<AppShellOptions["title"]>;
    /** Skip-link text/setting, or a resolver re-read during locale refresh. */
    skipLink?: PublicAppTemplateValue<AppShellOptions["skipLink"]>;
    /** Navigation landmark label, or a resolver re-read during locale refresh. */
    navigationLabel?: PublicAppTemplateValue<AppShellOptions["navigationLabel"]>;
    /** Page fallback-text locale override. Defaults to the app locale when it exposes t(). */
    locale?: AppShellOptions["locale"];
    /** Initial metadata, or a resolver re-read during locale refresh. */
    metadata?: PublicAppTemplateValue<PublicAppTemplateMetadata>;
    /** PageOutlet options, or a resolver re-read during locale refresh. */
    outletOptions?: PublicAppTemplateValue<AppShellOutletOptions>;
}

/**
 * Minimal template options needed by shared public app template helpers.
 */
export interface PublicAppTemplateBaseOptions {
    /** Optional app shell configuration. */
    shell?: PublicAppTemplateShellOptions;
    /** Stable public app identity used by template-owned route chrome defaults. */
    identity?: AppIdentity | null;
    /** Optional app locale controller or text provider. */
    locale?: unknown | null;
}

/**
 * Minimal template options needed to attach a locale controller to diagnostics defaults.
 */
export interface PublicAppTemplateDiagnosticsBaseOptions<
    TLocale extends LocaleCode,
    TKey extends string,
    TDiagnosticsOptions extends { locale?: PublicAppDiagnosticsLocaleResolver<TLocale, TKey> }
> extends PublicAppTemplateBaseOptions {
    /** Diagnostics options accepted by the concrete public app template, or false to disable diagnostics. */
    diagnostics?: TDiagnosticsOptions | false;
}

/**
 * Resolves a static template value or calls its zero-argument resolver.
 */
export function resolvePublicAppTemplateValue<TValue>(
    value: PublicAppTemplateValue<TValue> | undefined
): TValue | undefined {
    return typeof value === "function"
        ? (value as () => TValue)()
        : value;
}

/**
 * Resolves a static template value or calls its context-aware resolver.
 */
export function resolvePublicAppTemplateContextValue<TValue, TContext>(
    value: PublicAppTemplateContextValue<TValue, TContext>,
    context: TContext
): TValue {
    return typeof value === "function"
        ? (value as (context: TContext) => TValue)(context)
        : value;
}

/**
 * Returns true when a value can provide localized fallback text to AppShell.
 */
export function isPublicAppTemplateLocaleTextProvider<TKey extends string = string>(
    value: unknown
): value is LocaleTextProvider<TKey> {
    return Boolean(
        value
        && typeof value === "object"
        && "t" in value
        && typeof (value as LocaleTextProvider<TKey>).t === "function"
    );
}

/**
 * Returns true when a value is a full LocaleController suitable for diagnostics.
 */
export function isPublicAppTemplateLocaleController<
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

function getPublicAppTemplateShellLocale(
    options: PublicAppTemplateBaseOptions
): AppShellOptions["locale"] | undefined {
    if (options.shell && "locale" in options.shell) return options.shell.locale;
    if (isPublicAppTemplateLocaleTextProvider(options.locale)) return options.locale;

    return undefined;
}

function getPublicAppTemplateNavigationId(options: PublicAppTemplateBaseOptions): string {
    return options.shell?.skipLinkTargetId ?? "app-navigation";
}

function getPublicAppTemplateIdentityMetadata(
    options: PublicAppTemplateBaseOptions
): DocumentMetadataUpdateOptions | undefined {
    return options.identity
        ? createAppIdentityDocumentMetadata(options.identity)
        : undefined;
}

function getPublicAppTemplateShellMetadata(
    options: PublicAppTemplateBaseOptions
): PublicAppTemplateMetadata | undefined {
    const resolvedMetadata = resolvePublicAppTemplateValue(options.shell?.metadata);

    if (resolvedMetadata === false) return false;

    const identityMetadata = getPublicAppTemplateIdentityMetadata(options);

    if (identityMetadata === undefined) return resolvedMetadata;

    return {
        ...identityMetadata,
        ...(resolvedMetadata ?? {})
    };
}

/**
 * Creates the standard route chrome options used by public app template shorthand.
 */
export function createPublicAppTemplateDefaultRouteChromeOptions<
    TRoute extends AppRouteDescriptor,
    TOptions extends { routes: readonly TRoute[] },
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
>(
    options: PublicAppTemplateBaseOptions
): PublicAppTemplateRouteChromeBaseOptions<TRoute, TOptions> {
    const header: AppRouteChromeHeaderOptions<TLocale, TKey> = {};

    if ("identity" in options) header.identity = options.identity ?? null;

    if (isPublicAppTemplateLocaleController<TLocale, TKey>(options.locale)) {
        header.locale = options.locale as NonNullable<AppRouteChromeHeaderOptions<TLocale, TKey>["locale"]>;
    }

    return {
        header,
        navigation: {
            id: getPublicAppTemplateNavigationId(options)
        },
        breadcrumbs: {},
        search: {},
        commands: {}
    } as unknown as PublicAppTemplateRouteChromeBaseOptions<TRoute, TOptions>;
}

/**
 * Resolves declarative route chrome options and merges resolver-backed shell refresh updates.
 */
export function resolvePublicAppTemplateRouteChromeOptions<
    TRoute extends AppRouteDescriptor,
    TOptions extends {
        routes: readonly TRoute[];
        shell?: AppShellUpdateOptions;
        routeText?: PublicAppTemplateRouteChromeRouteText<TRoute> | false;
    },
    TContext
>(
    routeChrome: PublicAppTemplateContextValue<
        PublicAppTemplateRouteChromeBaseOptions<TRoute, TOptions> | PublicAppTemplateDefaultRouteChrome,
        TContext
    >,
    context: TContext,
    templateOptions: PublicAppTemplateBaseOptions & {
        routes: readonly TRoute[];
        routeText?: PublicAppTemplateRouteText<TRoute> | false;
    }
): TOptions {
    const resolvedRouteChromeOptions = resolvePublicAppTemplateContextValue(routeChrome, context);
    const routeChromeOptions = resolvedRouteChromeOptions === true
        ? createPublicAppTemplateDefaultRouteChromeOptions<TRoute, TOptions>(templateOptions)
        : resolvedRouteChromeOptions;
    const nextOptions = {
        ...routeChromeOptions,
        routes: routeChromeOptions.routes ?? templateOptions.routes
    } as TOptions & { routeText?: PublicAppTemplateRouteChromeRouteText<TRoute> | false };
    const routeText = routeChromeOptions.routeText ?? templateOptions.routeText;

    if (routeText !== undefined) nextOptions.routeText = routeText;

    return withPublicAppTemplateShellUpdate(
        nextOptions as TOptions,
        getPublicAppTemplateShellUpdateOptions(templateOptions)
    );
}

/**
 * Adds resolver-backed shell updates to route chrome options when locale refresh needs them.
 */
export function withPublicAppTemplateShellUpdate<
    TOptions extends { shell?: AppShellUpdateOptions }
>(
    routeChromeOptions: TOptions,
    shellUpdateOptions: AppShellUpdateOptions
): TOptions {
    if (!hasPublicAppTemplateShellUpdateOptions(shellUpdateOptions) && routeChromeOptions.shell === undefined) {
        return routeChromeOptions;
    }

    return {
        ...routeChromeOptions,
        shell: {
            ...shellUpdateOptions,
            ...(routeChromeOptions.shell ?? {})
        }
    } as TOptions;
}

/**
 * Merges localized route text defaults into app-owned route metadata options.
 */
export function getPublicAppTemplateRouteMetadata<
    TRoute extends AppRouteDescriptor,
    TRouteMetadata extends object
>(
    routeMetadata: TRouteMetadata | false | undefined,
    routeText: PublicAppTemplateRouteText<TRoute> | false | undefined
): TRouteMetadata | false | undefined {
    if (!routeText) return routeMetadata;
    if (routeMetadata === false) return false;

    return {
        ...routeText.routeOptions,
        ...(routeMetadata ?? {})
    } as TRouteMetadata;
}

/**
 * Adds the app locale controller to diagnostics defaults when the concrete template can infer it safely.
 */
export function getPublicAppTemplateDiagnosticsOptions<
    TLocale extends LocaleCode,
    TKey extends string,
    TDiagnosticsOptions extends { locale?: PublicAppDiagnosticsLocaleResolver<TLocale, TKey> }
>(
    options: PublicAppTemplateDiagnosticsBaseOptions<TLocale, TKey, TDiagnosticsOptions>
): TDiagnosticsOptions | false | undefined {
    if (options.diagnostics === false) return false;

    const diagnosticsOptions = (options.diagnostics ?? {}) as TDiagnosticsOptions;

    if (
        diagnosticsOptions.locale !== undefined
        || !isPublicAppTemplateLocaleController<TLocale, TKey>(options.locale)
    ) {
        return diagnosticsOptions;
    }

    return {
        ...diagnosticsOptions,
        locale: options.locale
    } as TDiagnosticsOptions;
}

/**
 * Creates AppShell options with public app template defaults applied.
 */
export function getPublicAppTemplateShellOptions(
    options: PublicAppTemplateBaseOptions
): AppShellOptions {
    const shellOptions = options.shell ?? {};
    const {
        title,
        skipLink,
        navigationLabel,
        locale: _locale,
        metadata,
        outletOptions,
        theme,
        ...baseShellOptions
    } = shellOptions;
    const shell: AppShellOptions = {
        ...baseShellOptions,
        mainId: baseShellOptions.mainId ?? "main",
        theme: theme ?? "system"
    };
    const shellLocale = getPublicAppTemplateShellLocale(options);
    const resolvedTitle = resolvePublicAppTemplateValue(title);
    const resolvedSkipLink = resolvePublicAppTemplateValue(skipLink);
    const resolvedNavigationLabel = resolvePublicAppTemplateValue(navigationLabel);
    const resolvedMetadata = getPublicAppTemplateShellMetadata(options);
    const resolvedOutletOptions = resolvePublicAppTemplateValue(outletOptions);

    if (resolvedTitle !== undefined) shell.title = resolvedTitle;
    if (resolvedSkipLink !== undefined) shell.skipLink = resolvedSkipLink;
    if (resolvedNavigationLabel !== undefined) shell.navigationLabel = resolvedNavigationLabel;
    if (shellLocale !== undefined) shell.locale = shellLocale;
    if (resolvedMetadata !== undefined) shell.metadata = resolvedMetadata;
    if (resolvedOutletOptions !== undefined) shell.outletOptions = resolvedOutletOptions;

    return shell;
}

/**
 * Creates runtime AppShell updates from resolver-backed template shell options.
 */
export function getPublicAppTemplateShellUpdateOptions(
    options: PublicAppTemplateBaseOptions
): AppShellUpdateOptions {
    const shellOptions = options.shell ?? {};
    const updateOptions: AppShellUpdateOptions = {};
    const shellLocale = getPublicAppTemplateShellLocale(options);
    const resolvedTitle = resolvePublicAppTemplateValue(shellOptions.title);
    const resolvedSkipLink = resolvePublicAppTemplateValue(shellOptions.skipLink);
    const resolvedNavigationLabel = resolvePublicAppTemplateValue(shellOptions.navigationLabel);
    const resolvedMetadata = resolvePublicAppTemplateValue(shellOptions.metadata);
    const resolvedOutletOptions = resolvePublicAppTemplateValue(shellOptions.outletOptions);

    if (resolvedTitle !== undefined) updateOptions.title = resolvedTitle;
    if (resolvedSkipLink !== undefined) updateOptions.skipLink = resolvedSkipLink;
    if (shellOptions.skipLinkTargetId !== undefined) updateOptions.skipLinkTargetId = shellOptions.skipLinkTargetId;
    if (resolvedNavigationLabel !== undefined) updateOptions.navigationLabel = resolvedNavigationLabel;
    if (shellLocale !== undefined) updateOptions.locale = shellLocale;
    if (resolvedMetadata !== undefined && resolvedMetadata !== false) {
        updateOptions.metadata = resolvedMetadata as DocumentMetadataUpdateOptions;
    }
    if (resolvedOutletOptions !== undefined) updateOptions.outletOptions = resolvedOutletOptions;

    return updateOptions;
}

/**
 * Returns true when shell update options contain at least one runtime update.
 */
export function hasPublicAppTemplateShellUpdateOptions(options: AppShellUpdateOptions): boolean {
    return Object.keys(options).length > 0;
}
