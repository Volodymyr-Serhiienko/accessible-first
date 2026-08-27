import type { AppShellOptions, AppShellUpdateOptions } from "../app-shell";
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
 * Initial metadata accepted by public app template shell options.
 */
export type PublicAppTemplateMetadata = DocumentMetadataOptions | false;

/**
 * Common shell options accepted by public app templates.
 */
export interface PublicAppTemplateShellOptions extends Omit<
    AppShellOptions,
    "title" | "skipLink" | "navigationLabel" | "locale" | "metadata"
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

    if (resolvedTitle !== undefined) shell.title = resolvedTitle;
    if (resolvedSkipLink !== undefined) shell.skipLink = resolvedSkipLink;
    if (resolvedNavigationLabel !== undefined) shell.navigationLabel = resolvedNavigationLabel;
    if (shellLocale !== undefined) shell.locale = shellLocale;
    if (resolvedMetadata !== undefined) shell.metadata = resolvedMetadata;

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

/**
 * Returns true when shell update options contain at least one runtime update.
 */
export function hasPublicAppTemplateShellUpdateOptions(options: AppShellUpdateOptions): boolean {
    return Object.keys(options).length > 0;
}
