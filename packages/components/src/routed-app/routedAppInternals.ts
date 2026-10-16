import {
    type AppShellCompositionContent,
    type AppShellUpdateOptions,
    type ComposedAppShell
} from "../app-shell";
import { addPageHideCleanup } from "../../../core/src/events";
import { toCompositionChildren, type CompositionChild } from "../composition";
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

const chromeSlots = ["header", "navigation", "beforeOutlet", "afterOutlet", "footer"] as const;

/** Collects returned slot candidates, including content overridden by direct slots. */
export function getRoutedAppChromeContent(chrome: RoutedAppChromeSlots): CompositionChild[] {
    return chromeSlots.flatMap(slot => [
        ...toCompositionChildren(chrome.shell?.[slot]), ...toCompositionChildren(chrome[slot])
    ]);
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
    const update: AppShellUpdateOptions = { ...(chrome.shell ?? {}) };
    for (const slot of chromeSlots) {
        if (slot in chrome) update[slot] = chrome[slot] ?? null;
    }
    if (Object.keys(update).length > 0) shell.update(update);
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
    return addPageHideCleanup(ownerWindow, destroy);
}
