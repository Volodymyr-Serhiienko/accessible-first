import type { BaseCompositionOptions } from "../composition";
import type { LocaleCode, LocaleSetOptions } from "../localization";

/** A locale option shared by the standard language picker controls. */
export interface LanguagePickerItem<TLocale extends LocaleCode = LocaleCode> {
    locale: TLocale;
    label?: string;
    disabled?: boolean;
    optionOptions?: BaseCompositionOptions;
}

/** Display format for automatically generated language labels. */
export type LanguagePickerNameFormat =
    | "localized"
    | "native"
    | "localized-and-native";

/** Overrides one automatic language label for the current interface locale. */
export type LanguagePickerItemLabelResolver<TLocale extends LocaleCode = LocaleCode> = (
    locale: TLocale,
    currentLocale: TLocale
) => string | null | undefined;

interface LanguagePickerItemSource<TLocale extends LocaleCode> {
    items?: readonly LanguagePickerItem<TLocale>[];
    nameFormat?: LanguagePickerNameFormat;
    getItemLabel?: LanguagePickerItemLabelResolver<TLocale> | null;
}

interface DisplayNamesConstructor {
    new(locales: string | readonly string[], options: { type: "language" }): {
        of(code: string): string | undefined;
    };
}

function getDisplayNamesConstructor(): DisplayNamesConstructor | null {
    const intl = Intl as typeof Intl & { DisplayNames?: DisplayNamesConstructor };

    return intl.DisplayNames ?? null;
}

/** Resolves a language display name, falling back when Intl data is unavailable. */
export function getLocaleDisplayName(locale: string, displayLocale: string): string {
    const DisplayNames = getDisplayNamesConstructor();

    if (!DisplayNames) return locale.toUpperCase();

    try {
        return new DisplayNames([displayLocale, locale, "en"], {
            type: "language"
        }).of(locale) ?? locale.toUpperCase();
    } catch {
        return locale.toUpperCase();
    }
}

function getAutomaticLanguageName(
    locale: string,
    displayLocale: string,
    format: LanguagePickerNameFormat
): string {
    const localizedName = getLocaleDisplayName(locale, displayLocale);

    if (format === "localized") return localizedName;

    const nativeName = getLocaleDisplayName(locale, locale);

    if (format === "native" || nativeName === localizedName) {
        return format === "native" ? nativeName : localizedName;
    }

    return `${localizedName} (${nativeName})`;
}

function getAutomaticItemLabel<TLocale extends LocaleCode>(
    options: LanguagePickerItemSource<TLocale>,
    locale: TLocale,
    currentLocale: TLocale
): { label: string; lang: string } {
    const resolvedLabel = options.getItemLabel?.(locale, currentLocale)?.trim();

    if (resolvedLabel) return { label: resolvedLabel, lang: currentLocale };

    return {
        label: getAutomaticLanguageName(locale, currentLocale, options.nameFormat ?? "localized"),
        lang: options.nameFormat === "native" ? locale : currentLocale
    };
}

/** Builds fixed-identity picker items with language metadata for automatic labels. */
export function getLanguagePickerItems<TLocale extends LocaleCode>(
    options: LanguagePickerItemSource<TLocale>,
    currentLocale: TLocale,
    supportedLocales: readonly TLocale[]
): LanguagePickerItem<TLocale>[] {
    if (options.items !== undefined) return options.items.map(item => item.label !== undefined ? item : {
        ...item,
        label: getLocaleDisplayName(item.locale, currentLocale),
        optionOptions: {
            ...item.optionOptions,
            attributes: { lang: currentLocale, ...item.optionOptions?.attributes }
        }
    });

    return supportedLocales.map((locale) => {
        const name = getAutomaticItemLabel(options, locale, currentLocale);
        return {
            locale,
            label: name.label,
            optionOptions: {
                attributes: { lang: name.lang }
            }
        };
    });
}

function getTextLength(value: string | null | undefined): number {
    return [...(value?.trim() ?? "")].length;
}

/** Calculates the shared preferred width without overriding responsive CSS constraints. */
export function getLanguagePickerWidth(
    width: string | null,
    autoWidth: boolean,
    items: readonly { label?: string }[],
    label: string | null
): string | null {
    const explicitWidth = width?.trim();

    if (explicitWidth) return explicitWidth;
    if (!autoWidth) return null;

    const longestTextLength = Math.max(
        4,
        getTextLength(label),
        ...items.map((item) => getTextLength(item.label))
    );

    return `calc(${longestTextLength}ch + 3.25rem)`;
}

/** Merges picker defaults with per-call overrides, including document direction. */
export function getLanguagePickerSetOptions(
    defaults: { persist?: LocaleSetOptions["persist"]; syncDocumentLanguage?: LocaleSetOptions["syncDocumentLanguage"] },
    overrides: LocaleSetOptions
): LocaleSetOptions {
    const result: LocaleSetOptions = { ...overrides, source: overrides.source ?? "programmatic" };
    if (result.persist === undefined && defaults.persist !== undefined) result.persist = defaults.persist;
    if (result.syncDocumentLanguage === undefined && defaults.syncDocumentLanguage !== undefined) {
        result.syncDocumentLanguage = defaults.syncDocumentLanguage;
    }
    return result;
}
