import type { PublicAppDiagnosticsLocaleResolver } from "../app-diagnostics";
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

/**
 * Resolves declarative route chrome options and merges resolver-backed shell refresh updates.
 */
export function resolvePublicAppTemplateRouteChromeOptions<
    TOptions extends { shell?: AppShellUpdateOptions },
    TContext
>(
    routeChrome: PublicAppTemplateContextValue<TOptions, TContext>,
    context: TContext,
    templateOptions: PublicAppTemplateBaseOptions
): TOptions {
    return withPublicAppTemplateShellUpdate(
        resolvePublicAppTemplateContextValue(routeChrome, context),
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

    if (diagnosticsOptions.locale !== undefined || !isPublicAppTemplateLocaleController<TLocale, TKey>(options.locale)) {
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
    const resolvedMetadata = resolvePublicAppTemplateValue(metadata);
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
