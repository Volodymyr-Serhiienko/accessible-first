import type { LocaleCode } from "./createLocaleController";

/**
 * Minimal locale source accepted by locale-aware search helpers.
 */
export interface LocaleSearchLocaleSource<TLocale extends LocaleCode = LocaleCode> {
    getLocale(): TLocale | string;
}

/**
 * Locale input accepted by locale-aware search helpers.
 */
export type LocaleSearchLocaleInput<TLocale extends LocaleCode = LocaleCode> =
    | TLocale
    | string
    | LocaleSearchLocaleSource<TLocale>
    | null
    | undefined;

/**
 * Text matching strategy used by locale-aware search helpers.
 */
export type LocaleSearchMatchMode =
    | "all-words"
    | "any-word"
    | "contains"
    | "starts-with"
    | "exact";

/**
 * Options for normalizeLocaleSearchText().
 */
export interface LocaleSearchNormalizeOptions<TLocale extends LocaleCode = LocaleCode> {
    locale?: LocaleSearchLocaleInput<TLocale>;
    caseSensitive?: boolean;
    ignoreDiacritics?: boolean;
    collapseWhitespace?: boolean;
    trim?: boolean;
}

/**
 * Options for matchesLocaleSearchText().
 */
export interface LocaleSearchMatchOptions<TLocale extends LocaleCode = LocaleCode>
    extends LocaleSearchNormalizeOptions<TLocale> {
    mode?: LocaleSearchMatchMode;
}

/**
 * Options for filtering in-memory items with locale-aware text matching.
 */
export interface LocaleSearchFilterOptions<
    TItem,
    TLocale extends LocaleCode = LocaleCode
> extends LocaleSearchMatchOptions<TLocale> {
    getText: (item: TItem) => string;
    getKeywords?: (item: TItem) => readonly string[] | null | undefined;
}

function getLocaleCode<TLocale extends LocaleCode>(
    locale: LocaleSearchLocaleInput<TLocale>
): string | undefined {
    if (locale === null || locale === undefined) return undefined;
    if (typeof locale === "string") return locale.trim() || undefined;

    const resolved = locale.getLocale();

    return resolved.trim() || undefined;
}

function stripCombiningMarks(value: string): string {
    return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function getSearchWords(value: string): string[] {
    return value.split(" ").filter(Boolean);
}

/**
 * Normalizes text for lightweight locale-aware search.
 */
export function normalizeLocaleSearchText<TLocale extends LocaleCode = LocaleCode>(
    value: string,
    options: LocaleSearchNormalizeOptions<TLocale> = {}
): string {
    const shouldTrim = options.trim ?? true;
    const shouldCollapseWhitespace = options.collapseWhitespace ?? true;
    const shouldIgnoreDiacritics = options.ignoreDiacritics ?? true;
    const locale = getLocaleCode(options.locale);
    let text = value;

    if (!options.caseSensitive) {
        text = locale ? text.toLocaleLowerCase(locale) : text.toLocaleLowerCase();
    }

    if (shouldIgnoreDiacritics) {
        text = stripCombiningMarks(text);
    }

    if (shouldCollapseWhitespace) {
        text = text.replace(/\s+/g, " ");
    }

    return shouldTrim ? text.trim() : text;
}

/**
 * Returns true when query matches text using a locale-aware matching strategy.
 */
export function matchesLocaleSearchText<TLocale extends LocaleCode = LocaleCode>(
    text: string,
    query: string,
    options: LocaleSearchMatchOptions<TLocale> = {}
): boolean {
    const normalizedQuery = normalizeLocaleSearchText(query, options);

    if (!normalizedQuery) return true;

    const normalizedText = normalizeLocaleSearchText(text, options);
    const mode = options.mode ?? "all-words";

    if (mode === "exact") return normalizedText === normalizedQuery;
    if (mode === "starts-with") return normalizedText.startsWith(normalizedQuery);
    if (mode === "contains") return normalizedText.includes(normalizedQuery);

    const words = getSearchWords(normalizedQuery);

    if (mode === "any-word") {
        return words.some((word) => normalizedText.includes(word));
    }

    return words.every((word) => normalizedText.includes(word));
}

/**
 * Filters an in-memory item list with locale-aware text and keyword matching.
 */
export function filterLocaleSearchItems<
    TItem,
    TLocale extends LocaleCode = LocaleCode
>(
    items: readonly TItem[],
    query: string,
    options: LocaleSearchFilterOptions<TItem, TLocale>
): TItem[] {
    return items.filter((item) => {
        const keywords = options.getKeywords?.(item) ?? [];
        const text = [options.getText(item), ...keywords].join(" ");

        return matchesLocaleSearchText(text, query, options);
    });
}