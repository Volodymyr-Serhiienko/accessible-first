import type { LocaleCode } from "./createLocaleController";

/**
 * Minimal locale source accepted by createLocaleFormatter().
 */
export interface LocaleFormatterLocaleSource<TLocale extends LocaleCode = LocaleCode> {
    getLocale(): TLocale | string;
}

/**
 * Locale input accepted by createLocaleFormatter().
 */
export type LocaleFormatterLocaleInput<TLocale extends LocaleCode = LocaleCode> =
    | TLocale
    | string
    | LocaleFormatterLocaleSource<TLocale>
    | null
    | undefined;

/**
 * Date-like value accepted by date formatting helpers.
 */
export type LocaleDateValue = Date | string | number;

/**
 * Relative time unit accepted by Intl.RelativeTimeFormat.
 */
export type LocaleRelativeTimeUnit =
    | "year"
    | "quarter"
    | "month"
    | "week"
    | "day"
    | "hour"
    | "minute"
    | "second";

/**
 * List formatting style accepted by Intl.ListFormat when available.
 */
export type LocaleListFormatStyle = "long" | "short" | "narrow";

/**
 * List relationship accepted by Intl.ListFormat when available.
 */
export type LocaleListFormatType = "conjunction" | "disjunction" | "unit";

/**
 * Options for locale-aware list formatting.
 */
export interface LocaleListFormatOptions {
    localeMatcher?: "best fit" | "lookup";
    style?: LocaleListFormatStyle;
    type?: LocaleListFormatType;
}

/**
 * Options for createLocaleFormatter().
 */
export interface LocaleFormatterOptions<TLocale extends LocaleCode = LocaleCode> {
    locale?: LocaleFormatterLocaleInput<TLocale>;
    fallbackLocale?: string;
    timeZone?: string | null;
}

/**
 * Options for locale-aware sorting helpers.
 */
export interface LocaleSortOptions<TItem> extends Intl.CollatorOptions {
    getText?: (item: TItem) => string;
}

/**
 * Intl-backed locale formatter for app copy, data, and route text.
 */
export interface LocaleFormatter<TLocale extends LocaleCode = LocaleCode> {
    getLocale(): TLocale | string;
    getLocales(): string[];
    formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
    formatDate(value: LocaleDateValue, options?: Intl.DateTimeFormatOptions): string;
    formatDateTime(value: LocaleDateValue, options?: Intl.DateTimeFormatOptions): string;
    formatRelativeTime(value: number, unit: LocaleRelativeTimeUnit, options?: Intl.RelativeTimeFormatOptions): string;
    formatList(values: readonly string[], options?: LocaleListFormatOptions): string;
    selectPlural(value: number, options?: Intl.PluralRulesOptions): Intl.LDMLPluralRule;
    compare(left: string, right: string, options?: Intl.CollatorOptions): number;
    sort<TItem>(items: readonly TItem[], options?: LocaleSortOptions<TItem>): TItem[];
}

type LocaleListFormatter = {
    format(values: readonly string[]): string;
};

type LocaleListFormatConstructor = new (
    locales?: string | readonly string[],
    options?: LocaleListFormatOptions
) => LocaleListFormatter;

type IntlWithListFormat = typeof Intl & {
    ListFormat?: LocaleListFormatConstructor;
};

function resolveLocale<TLocale extends LocaleCode>(
    locale: LocaleFormatterLocaleInput<TLocale>,
    fallbackLocale: string
): TLocale | string {
    if (locale === null || locale === undefined) return fallbackLocale;
    if (typeof locale === "string") return locale.trim() || fallbackLocale;

    const resolved = locale.getLocale();

    return resolved.trim() || fallbackLocale;
}

function resolveLocales<TLocale extends LocaleCode>(
    locale: LocaleFormatterLocaleInput<TLocale>,
    fallbackLocale: string
): string[] {
    const resolved = resolveLocale(locale, fallbackLocale);
    const locales = [resolved];

    if (fallbackLocale && fallbackLocale !== resolved) locales.push(fallbackLocale);

    return locales;
}

function toDate(value: LocaleDateValue): Date {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new RangeError("Invalid date value.");
    }

    return date;
}

function withDefaultTimeZone(
    options: Intl.DateTimeFormatOptions | undefined,
    timeZone: string | null
): Intl.DateTimeFormatOptions | undefined {
    if (!timeZone || options?.timeZone !== undefined) return options;

    return {
        ...(options ?? {}),
        timeZone
    };
}

function getListFormatConstructor(): LocaleListFormatConstructor | null {
    return (Intl as IntlWithListFormat).ListFormat ?? null;
}

/**
 * Creates a small locale-aware formatter around the browser Intl APIs.
 */
export function createLocaleFormatter<TLocale extends LocaleCode = LocaleCode>(
    options: LocaleFormatterOptions<TLocale> = {}
): LocaleFormatter<TLocale> {
    const fallbackLocale = options.fallbackLocale ?? "en";
    const timeZone = options.timeZone ?? null;

    function getLocale(): TLocale | string {
        return resolveLocale(options.locale, fallbackLocale);
    }

    function getLocales(): string[] {
        return resolveLocales(options.locale, fallbackLocale);
    }

    return {
        getLocale,
        getLocales,

        formatNumber(value, formatOptions): string {
            return new Intl.NumberFormat(getLocales(), formatOptions).format(value);
        },

        formatDate(value, formatOptions): string {
            return new Intl.DateTimeFormat(getLocales(), withDefaultTimeZone(
                formatOptions ?? {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                },
                timeZone
            )).format(toDate(value));
        },

        formatDateTime(value, formatOptions): string {
            return new Intl.DateTimeFormat(getLocales(), withDefaultTimeZone(
                formatOptions ?? {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                },
                timeZone
            )).format(toDate(value));
        },

        formatRelativeTime(value, unit, formatOptions): string {
            return new Intl.RelativeTimeFormat(getLocales(), {
                numeric: "auto",
                ...formatOptions
            }).format(value, unit);
        },

        formatList(values, formatOptions): string {
            const ListFormat = getListFormatConstructor();

            if (!ListFormat) return values.join(", ");

            return new ListFormat(getLocales(), formatOptions).format(values);
        },

        selectPlural(value, pluralOptions): Intl.LDMLPluralRule {
            return new Intl.PluralRules(getLocales(), pluralOptions).select(value);
        },

        compare(left, right, compareOptions): number {
            return new Intl.Collator(getLocales(), compareOptions).compare(left, right);
        },

        sort<TItem>(items: readonly TItem[], sortOptions: LocaleSortOptions<TItem> = {}): TItem[] {
            const { getText, ...collatorOptions } = sortOptions;
            const collator = new Intl.Collator(getLocales(), collatorOptions);

            return [...items].sort((left, right) => {
                const leftText = getText ? getText(left) : String(left);
                const rightText = getText ? getText(right) : String(right);

                return collator.compare(leftText, rightText);
            });
        }
    };
}