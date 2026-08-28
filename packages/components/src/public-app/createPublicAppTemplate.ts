import type { LocaleCode } from "../localization";
import {
    createPublicHashAppTemplate,
    type PublicHashAppTemplate,
    type PublicHashAppTemplateOptions
} from "./createPublicHashAppTemplate";
import type { PublicHashRoutedAppRoute } from "./createPublicHashRoutedApp";
import {
    createPublicLinkAppTemplate,
    type PublicLinkAppTemplate,
    type PublicLinkAppTemplateOptions
} from "./createPublicLinkAppTemplate";
import type { PublicLinkRoutedAppRoute } from "./createPublicLinkRoutedApp";

/**
 * Public app rendering/navigation mode selected by createPublicAppTemplate().
 */
export type PublicAppTemplateMode = "hash" | "link";

/**
 * Hash-SPA options accepted by createPublicAppTemplate().
 */
export interface PublicHashModeAppTemplateOptions<
    TRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> extends PublicHashAppTemplateOptions<TRoute, TLocale, TKey> {
    /** Uses hash routing and client-side screen rendering. This is the default mode. */
    mode?: "hash";
}

/**
 * Native-link or MPA options accepted by createPublicAppTemplate().
 */
export interface PublicLinkModeAppTemplateOptions<
    TRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> extends PublicLinkAppTemplateOptions<TRoute, TLocale, TKey> {
    /** Uses real links, current-route matching, and native browser navigation. */
    mode: "link";
}

/**
 * Union of supported createPublicAppTemplate() option shapes.
 */
export type PublicAppTemplateOptions<
    THashRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute,
    TLinkRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> =
    | PublicHashModeAppTemplateOptions<THashRoute, TLocale, TKey>
    | PublicLinkModeAppTemplateOptions<TLinkRoute, TLocale, TKey>;

/**
 * Runtime controller returned by createPublicAppTemplate().
 */
export type PublicAppTemplate<
    THashRoute extends PublicHashRoutedAppRoute = PublicHashRoutedAppRoute,
    TLinkRoute extends PublicLinkRoutedAppRoute = PublicLinkRoutedAppRoute
> =
    | PublicHashAppTemplate<THashRoute>
    | PublicLinkAppTemplate<TLinkRoute>;

/**
 * Creates the standard public Accessible First app template in hash-SPA mode.
 */
export function createPublicAppTemplate<
    TRoute extends PublicHashRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
>(options: PublicHashModeAppTemplateOptions<TRoute, TLocale, TKey>): PublicHashAppTemplate<TRoute>;

/**
 * Creates the standard public Accessible First app template in native-link or MPA mode.
 */
export function createPublicAppTemplate<
    TRoute extends PublicLinkRoutedAppRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
>(options: PublicLinkModeAppTemplateOptions<TRoute, TLocale, TKey>): PublicLinkAppTemplate<TRoute>;

/**
 * Dispatches to the selected public app template implementation.
 */
export function createPublicAppTemplate(
    options:
        | PublicHashModeAppTemplateOptions<PublicHashRoutedAppRoute, LocaleCode, string>
        | PublicLinkModeAppTemplateOptions<PublicLinkRoutedAppRoute, LocaleCode, string>
): PublicHashAppTemplate<PublicHashRoutedAppRoute> | PublicLinkAppTemplate<PublicLinkRoutedAppRoute> {
    if (options.mode === "link") {
        const { mode: _mode, ...linkOptions } = options;

        return createPublicLinkAppTemplate(linkOptions);
    }

    const { mode: _mode, ...hashOptions } = options;

    return createPublicHashAppTemplate(hashOptions);
}


