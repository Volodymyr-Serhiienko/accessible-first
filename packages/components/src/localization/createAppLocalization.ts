import {
    createLocaleController,
    createRequiredLocaleMessageKeys,
    type LocaleCode,
    type LocaleController,
    type LocaleControllerOptions,
    type LocaleMessageParams,
    type LocaleMessages,
    type LocaleRequiredMessagesSource
} from "./createLocaleController";
import {
    createLocaleFormatter,
    type LocaleFormatter,
    type LocaleFormatterOptions
} from "./createLocaleFormatter";
import {
    accessibleFirstEnglishMessages,
    type AccessibleFirstMessageKey
} from "./messages";

/**
 * Message-key union used by createAppLocalization() results.
 */
export type AppLocalizationMessageKey<TKey extends string = string> = TKey | AccessibleFirstMessageKey;

/**
 * Formatter options accepted by createAppLocalization(); locale is supplied by the created controller.
 */
export interface AppLocalizationFormatterOptions<TLocale extends LocaleCode = LocaleCode> extends Omit<
    LocaleFormatterOptions<TLocale>,
    "locale"
> {}

/**
 * Options for createAppLocalization(), the small app-owned localization starter helper.
 */
export interface AppLocalizationOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> extends LocaleControllerOptions<TLocale, TKey> {
    /** Includes built-in framework service text keys in requiredMessageKeys. Defaults to true. */
    requireFrameworkMessages?: boolean;
    /** Includes the fallback-locale app dictionary in requiredMessageKeys. Defaults to true. */
    requireFallbackMessages?: boolean;
    /** Extra dictionaries or key arrays merged into requiredMessageKeys for diagnostics. */
    requiredMessageSources?: readonly LocaleRequiredMessagesSource<TKey>[];
    /** Intl formatter options; fallbackLocale defaults to the created locale controller fallback. */
    formatterOptions?: AppLocalizationFormatterOptions<TLocale>;
}

/**
 * Application localization bundle returned by createAppLocalization().
 */
export interface AppLocalization<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> {
    /** Shared controller for framework service text and application-owned messages. */
    readonly locale: LocaleController<TLocale, AppLocalizationMessageKey<TKey>>;
    /** Intl-backed formatter that follows the current application locale. */
    readonly format: LocaleFormatter<TLocale>;
    /** Required framework and app-owned message keys intended for localization diagnostics. */
    readonly requiredMessageKeys: readonly AppLocalizationMessageKey<TKey>[];
    /** Convenience translator bound to the shared locale controller. */
    t(key: AppLocalizationMessageKey<TKey>, params?: LocaleMessageParams): string;
}

function normalizeAppLocalizationLocale(value: string | null | undefined): string | null {
    const normalized = value?.trim().toLowerCase() ?? "";

    return normalized.length > 0 ? normalized : null;
}

function getAppLocalizationFallbackLocale<
    TLocale extends LocaleCode,
    TKey extends string
>(options: AppLocalizationOptions<TLocale, TKey>): string {
    return options.fallbackLocale ?? options.supportedLocales?.[0] ?? "en";
}

function getAppLocalizationFallbackMessages<
    TLocale extends LocaleCode,
    TKey extends string
>(options: AppLocalizationOptions<TLocale, TKey>): LocaleMessages<TKey> | null {
    const messages = options.messages;

    if (!messages) return null;

    const fallbackLocale = getAppLocalizationFallbackLocale(options);
    const directMessages = messages[fallbackLocale];

    if (directMessages) return directMessages;

    const normalizedFallback = normalizeAppLocalizationLocale(fallbackLocale);

    if (!normalizedFallback) return null;

    for (const [locale, localeMessages] of Object.entries(messages)) {
        if (normalizeAppLocalizationLocale(locale) === normalizedFallback) return localeMessages;
    }

    return null;
}

function getRequiredMessageSources<
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: AppLocalizationOptions<TLocale, TKey>
): Array<LocaleRequiredMessagesSource<AppLocalizationMessageKey<TKey>>> {
    const sources: Array<LocaleRequiredMessagesSource<AppLocalizationMessageKey<TKey>>> = [];

    if (options.requireFrameworkMessages ?? true) {
        sources.push(accessibleFirstEnglishMessages as LocaleMessages<AppLocalizationMessageKey<TKey>>);
    }

    if (options.requireFallbackMessages ?? true) {
        const fallbackMessages = getAppLocalizationFallbackMessages(options);

        if (fallbackMessages) {
            sources.push(fallbackMessages as LocaleMessages<AppLocalizationMessageKey<TKey>>);
        }
    }

    for (const source of options.requiredMessageSources ?? []) {
        sources.push(source as LocaleRequiredMessagesSource<AppLocalizationMessageKey<TKey>>);
    }

    return sources;
}

function getFormatterOptions<
    TLocale extends LocaleCode,
    TKey extends string
>(
    locale: LocaleController<TLocale, AppLocalizationMessageKey<TKey>>,
    options: AppLocalizationOptions<TLocale, TKey>
): LocaleFormatterOptions<TLocale> {
    const formatterOptions: LocaleFormatterOptions<TLocale> = {
        locale,
        fallbackLocale: options.formatterOptions?.fallbackLocale ?? locale.fallbackLocale
    };
    const timeZone = options.formatterOptions?.timeZone;

    if (timeZone !== undefined) formatterOptions.timeZone = timeZone;

    return formatterOptions;
}

/**
 * Creates a small localization bundle for app starters: controller, formatter, diagnostics keys, and t().
 */
export function createAppLocalization<
    TLocale extends LocaleCode = "en",
    TKey extends string = AccessibleFirstMessageKey
>(options: AppLocalizationOptions<TLocale, TKey> = {}): AppLocalization<TLocale, TKey> {
    const locale = createLocaleController<TLocale, TKey>(options);
    const format = createLocaleFormatter<TLocale>(getFormatterOptions(locale, options));
    const requiredMessageKeys = createRequiredLocaleMessageKeys<AppLocalizationMessageKey<TKey>>(
        ...getRequiredMessageSources(options)
    );

    return {
        locale,
        format,
        requiredMessageKeys,

        t(key, params): string {
            return locale.t(key, params);
        }
    };
}