import type { PublicAppDiagnosticsLocaleResolver } from "../app-diagnostics";
import { runCleanups } from "../../../core/src/events";
import { toCompositionChildren, type CompositionChild } from "../composition";
import { getDestroyer } from "../composition/append";
import { discardPreparedContent } from "../composition/preparedContent";
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
    AppShellUpdateOptions,
    ComposedAppShell
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

type PublicAppTemplateShellSlot = AppShellOptions["header"];

/**
 * Common shell options accepted by public app templates.
 */
export interface PublicAppTemplateShellOptions extends Omit<
    AppShellOptions,
    | "title"
    | "skipLink"
    | "navigationLabel"
    | "locale"
    | "metadata"
    | "outletOptions"
    | "header"
    | "navigation"
    | "beforeOutlet"
    | "afterOutlet"
    | "footer"
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
    /** Header slot content, or a resolver re-read during locale refresh. */
    header?: PublicAppTemplateValue<PublicAppTemplateShellSlot>;
    /** Navigation slot content, or a resolver re-read during locale refresh. */
    navigation?: PublicAppTemplateValue<PublicAppTemplateShellSlot>;
    /** Before-outlet slot content, or a resolver re-read during locale refresh. */
    beforeOutlet?: PublicAppTemplateValue<PublicAppTemplateShellSlot>;
    /** After-outlet slot content, or a resolver re-read during locale refresh. */
    afterOutlet?: PublicAppTemplateValue<PublicAppTemplateShellSlot>;
    /** Footer slot content, or a resolver re-read during locale refresh. */
    footer?: PublicAppTemplateValue<PublicAppTemplateShellSlot>;
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
    options: PublicAppTemplateBaseOptions,
    title?: AppShellOptions["title"]
): PublicAppTemplateMetadata | undefined {
    const resolvedMetadata = resolvePublicAppTemplateValue(options.shell?.metadata);

    if (resolvedMetadata === false) return false;

    const identityMetadata = getPublicAppTemplateIdentityMetadata(options);

    if (identityMetadata === undefined) return resolvedMetadata;

    return {
        ...identityMetadata,
        ...(title !== undefined ? { title } : {}),
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
    TContext extends { shell: ComposedAppShell }
>(
    routeChrome: PublicAppTemplateContextValue<
        PublicAppTemplateRouteChromeBaseOptions<TRoute, TOptions> | PublicAppTemplateDefaultRouteChrome,
        TContext
    >,
    context: TContext,
    templateOptions: PublicAppTemplateBaseOptions & {
        routes: readonly TRoute[];
        routeText?: PublicAppTemplateRouteText<TRoute> | false;
    },
    preserveDocumentTitle = false
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

    const shellOptions = { ...(templateOptions.shell ?? {}) };
    for (const key of Object.keys(routeChromeOptions.shell ?? {})) {
        delete shellOptions[key as keyof PublicAppTemplateShellOptions];
    }
    const shellUpdate = getPublicAppTemplateShellUpdateOptions(
        { ...templateOptions, shell: shellOptions }, false, { owner: context.shell }
    );
    if (preserveDocumentTitle) {
        delete shellUpdate.title;
        if (shellUpdate.metadata) {
            shellUpdate.metadata = { ...shellUpdate.metadata };
            delete shellUpdate.metadata.title;
        }
    }
    return withPublicAppTemplateShellUpdate(nextOptions as TOptions, shellUpdate);
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
 * Creates initial AppShell options, optionally resolving static-template content.
 * Returned factory children are cleaned if a later content factory fails.
 */
export function getPublicAppTemplateShellOptions(
    options: PublicAppTemplateBaseOptions,
    content?: PublicAppTemplateValue<AppShellOptions["content"]>
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
        header,
        navigation,
        beforeOutlet,
        afterOutlet,
        footer,
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
    const resolvedMetadata = getPublicAppTemplateShellMetadata(options, resolvedTitle);
    const resolvedOutletOptions = resolvePublicAppTemplateValue(outletOptions);
    const prepared: CompositionChild[] = [];
    function resolveSlot(value: PublicAppTemplateValue<PublicAppTemplateShellSlot> | undefined): PublicAppTemplateShellSlot {
        const resolved = resolvePublicAppTemplateValue(value);
        if (typeof value === "function") prepared.push(...toCompositionChildren(resolved));
        return resolved;
    }

    // Until AppShell is called, only returned factory results belong to this batch.
    try {
        const resolvedHeader = resolveSlot(header);
        const resolvedNavigation = resolveSlot(navigation);
        const resolvedBeforeOutlet = resolveSlot(beforeOutlet);
        const resolvedAfterOutlet = resolveSlot(afterOutlet);
        const resolvedFooter = resolveSlot(footer);

        if (resolvedHeader !== undefined) shell.header = resolvedHeader;
        if (resolvedNavigation !== undefined) shell.navigation = resolvedNavigation;
        if (resolvedBeforeOutlet !== undefined) shell.beforeOutlet = resolvedBeforeOutlet;
        if (resolvedAfterOutlet !== undefined) shell.afterOutlet = resolvedAfterOutlet;
        if (resolvedFooter !== undefined) shell.footer = resolvedFooter;
        if (content !== undefined) shell.content = resolveSlot(content) ?? null;
    } catch (error) {
        try {
            runCleanups([...new Set(prepared)].reverse().map(child => () => getDestroyer(child)?.()));
        } catch { /* Preserve the resolver failure after attempting every cleanup. */ }
        throw error;
    }

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
    options: PublicAppTemplateBaseOptions,
    includeIdentityMetadata = false,
    preparation?: { owner: ComposedAppShell; isCurrent?: () => boolean }
): AppShellUpdateOptions {
    const shellOptions = options.shell ?? {};
    const updateOptions: AppShellUpdateOptions = {};
    const shellLocale = getPublicAppTemplateShellLocale(options);
    const isCurrent = (): boolean => !preparation?.owner.isDestroyed() && preparation?.isCurrent?.() !== false;
    const resolveValue = <T>(value: PublicAppTemplateValue<T> | undefined): T | undefined =>
        isCurrent() ? resolvePublicAppTemplateValue(value) : undefined;
    const resolvedTitle = resolveValue(shellOptions.title);
    const resolvedSkipLink = resolveValue(shellOptions.skipLink);
    const resolvedNavigationLabel = resolveValue(shellOptions.navigationLabel);
    const resolvedMetadata = includeIdentityMetadata && isCurrent()
        ? getPublicAppTemplateShellMetadata(options, resolvedTitle)
        : resolveValue(shellOptions.metadata);
    const resolvedOutletOptions = resolveValue(shellOptions.outletOptions);
    const prepared: CompositionChild[] = [];
    function resolveSlot(value: PublicAppTemplateValue<PublicAppTemplateShellSlot> | undefined): PublicAppTemplateShellSlot {
        const resolved = resolveValue(value);
        if (typeof value === "function") prepared.push(...toCompositionChildren(resolved));
        return resolved;
    }
    try {
        const header = resolveSlot(shellOptions.header);
        const navigation = resolveSlot(shellOptions.navigation);
        const beforeOutlet = resolveSlot(shellOptions.beforeOutlet);
        const afterOutlet = resolveSlot(shellOptions.afterOutlet);
        const footer = resolveSlot(shellOptions.footer);
        if (!isCurrent()) {
            if (preparation) discardPreparedContent(preparation.owner, prepared);
            return {};
        }
        if ("header" in shellOptions && header !== undefined) updateOptions.header = header;
        if ("navigation" in shellOptions && navigation !== undefined) updateOptions.navigation = navigation;
        if ("beforeOutlet" in shellOptions && beforeOutlet !== undefined) updateOptions.beforeOutlet = beforeOutlet;
        if ("afterOutlet" in shellOptions && afterOutlet !== undefined) updateOptions.afterOutlet = afterOutlet;
        if ("footer" in shellOptions && footer !== undefined) updateOptions.footer = footer;
    } catch (error) {
        try { if (preparation) discardPreparedContent(preparation.owner, prepared); }
        catch { /* Preserve the resolver failure. */ }
        throw error;
    }

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
