import type { BaseCompositionOptions } from "../composition";
import type { LocaleCode } from "../localization";

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
): string {
    const resolvedLabel = options.getItemLabel?.(locale, currentLocale)?.trim();

    if (resolvedLabel) return resolvedLabel;

    return getAutomaticLanguageName(
        locale,
        currentLocale,
        options.nameFormat ?? "localized"
    );
}

export function getLanguagePickerItems<TLocale extends LocaleCode>(
    options: LanguagePickerItemSource<TLocale>,
    currentLocale: TLocale,
    supportedLocales: readonly TLocale[]
): LanguagePickerItem<TLocale>[] {
    if (options.items !== undefined) return [...options.items];

    return supportedLocales.map((locale) => ({
        locale,
        label: getAutomaticItemLabel(options, locale, currentLocale),
        optionOptions: {
            attributes: {
                lang: currentLocale
            }
        }
    }));
}

function getTextLength(value: string | null | undefined): number {
    return [...(value?.trim() ?? "")].length;
}

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
