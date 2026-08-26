import {
    type AppShellCompositionContent,
    type AppShellUpdateOptions,
    type ComposedAppShell
} from "../app-shell";
import {
    type LocaleCode,
    type LocaleRefreshHandler,
    type LocaleRefreshLocale,
    type LocaleRefreshOptions
} from "../localization";

/**
 * Shared shell slot fields used by routed app runtime recipes.
 */
export interface RoutedAppChromeSlots {
    shell?: AppShellUpdateOptions;
    header?: AppShellCompositionContent | null;
    navigation?: AppShellCompositionContent | null;
    beforeOutlet?: AppShellCompositionContent | null;
    afterOutlet?: AppShellCompositionContent | null;
    footer?: AppShellCompositionContent | null;
}

/**
 * Shared locale refresh options accepted by routed app runtime recipes.
 */
export interface RoutedAppLocaleRefreshOptions<
    TLocale extends LocaleCode = LocaleCode
> extends Omit<LocaleRefreshOptions<TLocale>, "locale" | "refresh"> {}

/**
 * Applies routed app chrome slots to an AppShell without recreating the shell.
 */
export function applyRoutedAppChromeSlots(
    shell: ComposedAppShell,
    chrome: RoutedAppChromeSlots
): void {
    if (chrome.shell !== undefined) shell.update(chrome.shell);
    if ("header" in chrome) shell.setHeader(chrome.header ?? null);
    if ("navigation" in chrome) shell.setNavigation(chrome.navigation ?? null);
    if ("beforeOutlet" in chrome) shell.setBeforeOutlet(chrome.beforeOutlet ?? null);
    if ("afterOutlet" in chrome) shell.setAfterOutlet(chrome.afterOutlet ?? null);
    if ("footer" in chrome) shell.setFooter(chrome.footer ?? null);
}

/**
 * Creates LocaleRefresh options from the shared routed app locale contract.
 */
export function getRoutedAppLocaleRefreshOptions<
    TLocale extends LocaleCode
>(
    locale: LocaleRefreshLocale<TLocale>,
    options: RoutedAppLocaleRefreshOptions<TLocale> | false | undefined,
    refresh: LocaleRefreshHandler<TLocale>
): LocaleRefreshOptions<TLocale> | null {
    if (options === false) return null;

    const refreshOptions: LocaleRefreshOptions<TLocale> = {
        locale,
        refresh
    };

    if (options?.schedule !== undefined) refreshOptions.schedule = options.schedule;
    if (options?.immediate !== undefined) refreshOptions.immediate = options.immediate;

    return refreshOptions;
}

/**
 * Registers pagehide cleanup for routed app runtime recipes.
 */
export function setupRoutedAppPageHideCleanup(
    shell: ComposedAppShell,
    destroy: () => void,
    destroyOnPageHide: boolean | undefined
): (() => void) | null {
    if (destroyOnPageHide === false || typeof window === "undefined") return null;

    const ownerWindow = shell.element.ownerDocument.defaultView ?? window;
    const handlePageHide = (event: PageTransitionEvent): void => {
        if (event.persisted) return;

        destroy();
    };

    ownerWindow.addEventListener("pagehide", handlePageHide, { once: true });

    return () => {
        ownerWindow.removeEventListener("pagehide", handlePageHide);
    };
}
