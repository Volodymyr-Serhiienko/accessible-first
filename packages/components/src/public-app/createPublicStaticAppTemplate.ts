import {
    AppShell,
    type AppShellCompositionContent,
    type ComposedAppShell
} from "../app-shell";
import {
    type AppDiagnosticsReport,
    type AppDiagnosticsRunner,
    createPublicAppDiagnosticsRunner,
    type PublicAppDiagnosticsIdentityResolver,
    type PublicAppDiagnosticsLocaleResolver,
    type PublicAppDiagnosticsPageResolver,
    type PublicAppDiagnosticsRunnerOptions
} from "../app-diagnostics";
import type { AppIdentity } from "../app-identity";
import {
    mount as mountTree,
    type MountedTree,
    type MountOptions,
    type MountTarget
} from "../composition";
import {
    createLocaleRefresh,
    type LocaleCode,
    type LocaleController
} from "../localization";
import type { PageOutletRenderOptions } from "../page-outlet";
import {
    getRoutedAppLocaleRefreshOptions,
    setupRoutedAppPageHideCleanup,
    type RoutedAppLocaleRefreshOptions
} from "../routed-app/routedAppInternals";
import {
    getPublicAppTemplateShellOptions,
    getPublicAppTemplateShellUpdateOptions,
    hasPublicAppTemplateShellUpdateOptions,
    resolvePublicAppTemplateValue,
    type PublicAppTemplateBaseOptions,
    type PublicAppTemplateShellOptions as SharedPublicAppTemplateShellOptions,
    type PublicAppTemplateValue as SharedPublicAppTemplateValue
} from "./publicAppTemplateInternals";

/**
 * Static value or lazy resolver accepted by public static app templates.
 */
export type PublicStaticAppTemplateValue<TValue> = SharedPublicAppTemplateValue<TValue>;

/**
 * Content accepted by createPublicStaticAppTemplate().
 */
export type PublicStaticAppTemplateContent = AppShellCompositionContent | null;

/**
 * Mount target accepted by createPublicStaticAppTemplate().
 */
export type PublicStaticAppTemplateMount = MountTarget | false | null;

/**
 * Shell options accepted by createPublicStaticAppTemplate().
 */
export interface PublicStaticAppTemplateShellOptions extends SharedPublicAppTemplateShellOptions {}

/**
 * Locale refresh options accepted by createPublicStaticAppTemplate().
 */
export interface PublicStaticAppTemplateLocaleRefreshOptions<
    TLocale extends LocaleCode = LocaleCode
> extends RoutedAppLocaleRefreshOptions<TLocale> {}

/**
 * Diagnostics options accepted by createPublicStaticAppTemplate().
 */
export interface PublicStaticAppTemplateDiagnosticsOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> extends Omit<PublicAppDiagnosticsRunnerOptions<TLocale, TKey>, "page" | "identity" | "locale" | "routes"> {
    /** Page diagnostics source. Defaults to the created AppShell; pass false to omit page diagnostics. */
    page?: PublicAppDiagnosticsPageResolver | false;
    /** Identity diagnostics source. Defaults to the template identity; pass false to omit identity-derived diagnostics. */
    identity?: PublicAppDiagnosticsIdentityResolver | false;
    /** Locale diagnostics source. Defaults to the template locale controller; pass false to omit locale diagnostics. */
    locale?: PublicAppDiagnosticsLocaleResolver<TLocale, TKey> | false;
    /** Logs diagnostics after the app is created. Defaults to true. */
    logOnCreate?: boolean;
    /** Logs diagnostics after locale/manual refresh. Defaults to false. */
    logOnRefresh?: boolean;
}

/**
 * Manual refresh options for a public static app template.
 */
export interface PublicStaticAppTemplateRefreshOptions {
    shell?: boolean;
    content?: boolean;
    diagnostics?: boolean;
    renderOptions?: PageOutletRenderOptions;
}

/**
 * Options for createPublicStaticAppTemplate(), the route-free public site/app recipe.
 */
export interface PublicStaticAppTemplateOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> {
    /** Target where the shell should be mounted. Omit it to mount manually. */
    mount?: PublicStaticAppTemplateMount;
    /** Mount behavior passed to mount(). */
    mountOptions?: MountOptions;
    /** Stable public app identity or lazy identity resolver. */
    identity?: PublicStaticAppTemplateValue<AppIdentity | null | undefined>;
    /** Optional locale controller used by shell text, refresh, and diagnostics. */
    locale?: LocaleController<TLocale, TKey> | null;
    /** AppShell settings with template defaults and locale-refresh support. */
    shell?: PublicStaticAppTemplateValue<PublicStaticAppTemplateShellOptions | undefined>;
    /** Static screen/page content or lazy content resolver. */
    content: PublicStaticAppTemplateValue<PublicStaticAppTemplateContent | undefined>;
    /** Render behavior used when content is refreshed. */
    refreshRenderOptions?: PageOutletRenderOptions;
    /** Public app diagnostics recipe options. Pass false to disable diagnostics. */
    diagnostics?: PublicStaticAppTemplateDiagnosticsOptions<TLocale, TKey> | false;
    /** Locale refresh behavior. Pass false to disable locale-driven refresh. */
    localeRefresh?: PublicStaticAppTemplateLocaleRefreshOptions<TLocale> | false;
    /** Destroy the shell on pagehide. Defaults to true. */
    destroyOnPageHide?: boolean;
}

/**
 * Runtime controller returned by createPublicStaticAppTemplate().
 */
export interface PublicStaticAppTemplate<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> {
    readonly shell: ComposedAppShell;
    readonly locale: LocaleController<TLocale, TKey> | null;
    readonly diagnostics: AppDiagnosticsRunner | null;
    readonly mounted: MountedTree | null;
    mount(target: MountTarget, options?: MountOptions): MountedTree;
    refresh(options?: PublicStaticAppTemplateRefreshOptions): void;
    inspectDiagnostics(): AppDiagnosticsReport | null;
    logDiagnostics(): AppDiagnosticsReport | null;
    destroy(): void;
    isDestroyed(): boolean;
}

const defaultRefreshRenderOptions: PageOutletRenderOptions = {
    focusTarget: null,
    scroll: false,
    announcement: false
};

function resolveTemplateIdentity<
    TLocale extends LocaleCode,
    TKey extends string
>(options: PublicStaticAppTemplateOptions<TLocale, TKey>): AppIdentity | null {
    return resolvePublicAppTemplateValue(options.identity) ?? null;
}

function getTemplateBaseOptions<
    TLocale extends LocaleCode,
    TKey extends string
>(options: PublicStaticAppTemplateOptions<TLocale, TKey>): PublicAppTemplateBaseOptions {
    const shell = resolvePublicAppTemplateValue(options.shell);
    const baseOptions: PublicAppTemplateBaseOptions = {};

    if (shell !== undefined) baseOptions.shell = shell;
    if ("identity" in options) baseOptions.identity = resolveTemplateIdentity(options);
    if (options.locale !== undefined) baseOptions.locale = options.locale;

    return baseOptions;
}

function resolveTemplateContent<
    TLocale extends LocaleCode,
    TKey extends string
>(options: PublicStaticAppTemplateOptions<TLocale, TKey>): PublicStaticAppTemplateContent {
    return resolvePublicAppTemplateValue(options.content) ?? null;
}

function getTemplateShellOptions<
    TLocale extends LocaleCode,
    TKey extends string
>(options: PublicStaticAppTemplateOptions<TLocale, TKey>) {
    const shellOptions = getPublicAppTemplateShellOptions(getTemplateBaseOptions(options));

    shellOptions.content = resolveTemplateContent(options);

    return shellOptions;
}

function getTemplateRefreshRenderOptions<
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicStaticAppTemplateOptions<TLocale, TKey>,
    refreshOptions: PublicStaticAppTemplateRefreshOptions
): PageOutletRenderOptions {
    return {
        ...defaultRefreshRenderOptions,
        ...(options.refreshRenderOptions ?? {}),
        ...(refreshOptions.renderOptions ?? {})
    };
}

function shouldLogDiagnosticsOnCreate<
    TLocale extends LocaleCode,
    TKey extends string
>(options: PublicStaticAppTemplateOptions<TLocale, TKey>): boolean {
    return options.diagnostics !== false
        && (options.diagnostics?.logOnCreate ?? true);
}

function shouldLogDiagnosticsOnRefresh<
    TLocale extends LocaleCode,
    TKey extends string
>(options: PublicStaticAppTemplateOptions<TLocale, TKey>): boolean {
    return options.diagnostics !== false
        && options.diagnostics?.logOnRefresh === true;
}

function createTemplateDiagnostics<
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: PublicStaticAppTemplateOptions<TLocale, TKey>,
    shell: ComposedAppShell
): AppDiagnosticsRunner | null {
    if (options.diagnostics === false) return null;

    const diagnosticsOptions: PublicStaticAppTemplateDiagnosticsOptions<TLocale, TKey> =
        options.diagnostics ?? {};
    const {
        page,
        identity,
        locale,
        logOnCreate: _logOnCreate,
        logOnRefresh: _logOnRefresh,
        ...runnerOptions
    } = diagnosticsOptions;
    const nextOptions: PublicAppDiagnosticsRunnerOptions<TLocale, TKey> = {
        ...runnerOptions
    };

    if (page !== false) {
        nextOptions.page = page === undefined
            ? () => shell
            : page;
    }

    if (identity !== false) {
        nextOptions.identity = identity === undefined
            ? () => resolveTemplateIdentity(options)
            : identity;
    }

    if (locale !== false) {
        if (locale !== undefined) nextOptions.locale = locale;
        else if (options.locale) nextOptions.locale = options.locale;
    }

    return createPublicAppDiagnosticsRunner(nextOptions);
}

/**
 * Creates a route-free public Accessible First app template from shell, content,
 * diagnostics, locale, and metadata options.
 */
export function createPublicStaticAppTemplate<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
>(options: PublicStaticAppTemplateOptions<TLocale, TKey>): PublicStaticAppTemplate<TLocale, TKey> {
    const shell = AppShell(getTemplateShellOptions(options));
    const diagnostics = createTemplateDiagnostics(options, shell);

    let app!: PublicStaticAppTemplate<TLocale, TKey>;
    let mountedTree: MountedTree | null = null;
    let localeRefresh = options.locale
        ? createLocaleRefresh(getRoutedAppLocaleRefreshOptions(options.locale, options.localeRefresh, () => {
            app.refresh({
                diagnostics: shouldLogDiagnosticsOnRefresh(options)
            });
        })!)
        : null;
    let removePageHideListener: (() => void) | null = null;
    let destroyed = false;

    app = {
        shell,

        get locale(): LocaleController<TLocale, TKey> | null {
            return options.locale ?? null;
        },

        get diagnostics(): AppDiagnosticsRunner | null {
            return diagnostics;
        },

        get mounted(): MountedTree | null {
            return mountedTree;
        },

        mount(target, mountOptions = {}): MountedTree {
            if (destroyed) {
                throw new Error("Cannot mount a destroyed PublicStaticAppTemplate.");
            }

            mountedTree = mountTree(shell, target, mountOptions);

            return mountedTree;
        },

        refresh(refreshOptions = {}): void {
            if (destroyed) return;

            if (refreshOptions.shell ?? true) {
                const shellUpdateOptions = getPublicAppTemplateShellUpdateOptions(
                    getTemplateBaseOptions(options)
                );

                if (hasPublicAppTemplateShellUpdateOptions(shellUpdateOptions)) {
                    shell.update(shellUpdateOptions);
                }
            }

            if (refreshOptions.content ?? true) {
                shell.render(
                    resolveTemplateContent(options),
                    getTemplateRefreshRenderOptions(options, refreshOptions)
                );
            }

            if (refreshOptions.diagnostics ?? shouldLogDiagnosticsOnRefresh(options)) {
                diagnostics?.log();
            }
        },

        inspectDiagnostics(): AppDiagnosticsReport | null {
            return diagnostics?.inspect() ?? null;
        },

        logDiagnostics(): AppDiagnosticsReport | null {
            return diagnostics?.log() ?? null;
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            removePageHideListener?.();
            removePageHideListener = null;
            localeRefresh?.destroy();
            localeRefresh = null;

            if (mountedTree) {
                mountedTree.unmount();
                mountedTree = null;
                return;
            }

            shell.destroy();
        },

        isDestroyed(): boolean {
            return destroyed;
        }
    };

    removePageHideListener = setupRoutedAppPageHideCleanup(
        shell,
        () => app.destroy(),
        options.destroyOnPageHide
    );

    if (options.mount !== undefined && options.mount !== null && options.mount !== false) {
        app.mount(options.mount, options.mountOptions ?? {});
    }

    if (shouldLogDiagnosticsOnCreate(options)) {
        diagnostics?.log();
    }

    return app;
}
