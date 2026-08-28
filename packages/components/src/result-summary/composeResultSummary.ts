import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    hasCompositionContent,
    setElementAttributeValue,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";

/**
 * Content accepted by ResultSummary custom formatters.
 */
export type ResultSummaryCompositionContent = CompositionContent;

/**
 * Visual emphasis variant for ResultSummary.
 */
export type ResultSummaryVariant = "default" | "muted" | "strong";

/**
 * ResultSummary size token.
 */
export type ResultSummarySize = "md";

/**
 * Live-region mode used when result text changes dynamically.
 */
export type ResultSummaryLiveMode = "off" | "polite" | "assertive";

/**
 * Localized message keys used by ResultSummary fallback text.
 */
export type ResultSummaryMessageKey =
    | "resultSummary.empty"
    | "resultSummary.filtered"
    | "resultSummary.one"
    | "resultSummary.range"
    | "resultSummary.rangeUnknownTotal"
    | "resultSummary.total";

/**
 * Localization provider accepted by ResultSummary.
 */
export type ResultSummaryLocalization = LocaleTextProvider<ResultSummaryMessageKey>;

/**
 * Normalized result state passed to custom ResultSummary formatters.
 */
export interface ResultSummaryState {
    readonly total: number | null;
    readonly count: number | null;
    readonly start: number | null;
    readonly end: number | null;
    readonly page: number | null;
    readonly pageSize: number | null;
    readonly empty: boolean;
    readonly hasRange: boolean;
}

/**
 * Returns custom visible content for a ResultSummary state.
 */
export type ResultSummaryFormatter = (
    state: ResultSummaryState
) => ResultSummaryCompositionContent;

/**
 * Options for ResultSummary().
 */
export interface ResultSummaryOptions extends BaseCompositionOptions {
    total?: number | null;
    count?: number | null;
    start?: number | null;
    end?: number | null;
    page?: number | null;
    pageSize?: number | null;
    format?: ResultSummaryFormatter | null;
    live?: ResultSummaryLiveMode;
    atomic?: boolean;
    locale?: ResultSummaryLocalization | null;
    variant?: ResultSummaryVariant;
    size?: ResultSummarySize;
    contentOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedResultSummary.update().
 */
export interface ResultSummaryUpdateOptions extends Partial<ResultSummaryOptions> {}

/**
 * Result summary created by the composition API.
 */
export interface ComposedResultSummary extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly content: HTMLElement;
    getState(): ResultSummaryState;
    setTotal(total: number | null): void;
    setCount(count: number | null): void;
    setRange(start: number | null, end: number | null, total?: number | null): void;
    update(options: ResultSummaryUpdateOptions): void;
    destroy(): void;
}

type ResultSummarySlotContent = Exclude<ResultSummaryCompositionContent, undefined> | null;

function normalizeSlotContent(
    content: ResultSummaryCompositionContent | null | undefined
): ResultSummarySlotContent {
    return content === undefined ? null : content;
}

function normalizeCount(value: number | null | undefined): number | null {
    if (value === null || value === undefined || !Number.isFinite(value)) return null;

    return Math.max(0, Math.round(value));
}

function normalizePositiveInteger(value: number | null | undefined): number | null {
    if (value === null || value === undefined || !Number.isFinite(value)) return null;

    return Math.max(1, Math.round(value));
}

function normalizeRangeEnd(
    value: number | null,
    start: number | null,
    total: number | null
): number | null {
    if (value === null || start === null) return null;

    const normalized = Math.max(start, value);

    return total !== null && total > 0
        ? Math.min(normalized, total)
        : normalized;
}

function normalizeRangeStart(value: number | null, total: number | null): number | null {
    if (value === null) return null;

    return total !== null && total > 0
        ? Math.min(value, total)
        : value;
}

function getDerivedRangeStart(
    explicitStart: number | null,
    page: number | null,
    pageSize: number | null,
    total: number | null
): number | null {
    if (explicitStart !== null) return normalizeRangeStart(explicitStart, total);
    if (page === null || pageSize === null) return null;

    return normalizeRangeStart(((page - 1) * pageSize) + 1, total);
}

function getDerivedRangeEnd(
    explicitEnd: number | null,
    start: number | null,
    count: number | null,
    pageSize: number | null,
    total: number | null
): number | null {
    if (start === null) return null;
    if (explicitEnd !== null) return normalizeRangeEnd(explicitEnd, start, total);

    const span = count ?? pageSize;

    if (span === null) return null;

    return normalizeRangeEnd(start + Math.max(span - 1, 0), start, total);
}

function hasAnyResultInput(
    total: number | null,
    count: number | null,
    start: number | null,
    end: number | null,
    page: number | null,
    pageSize: number | null
): boolean {
    return total !== null
        || count !== null
        || start !== null
        || end !== null
        || page !== null
        || pageSize !== null;
}

function getFallbackText(
    locale: ResultSummaryLocalization | null,
    key: ResultSummaryMessageKey,
    params?: Record<string, string | number | boolean | null | undefined>
): string {
    return getLocaleText(
        locale,
        key,
        accessibleFirstEnglishMessages[key],
        params
    );
}

function getDefaultSummaryContent(
    state: ResultSummaryState,
    locale: ResultSummaryLocalization | null
): string {
    if (state.empty) {
        return getFallbackText(locale, "resultSummary.empty");
    }

    if (state.hasRange && state.start !== null && state.end !== null) {
        if (state.total !== null) {
            return getFallbackText(locale, "resultSummary.range", {
                start: state.start,
                end: state.end,
                total: state.total
            });
        }

        return getFallbackText(locale, "resultSummary.rangeUnknownTotal", {
            start: state.start,
            end: state.end
        });
    }

    if (state.count !== null && state.total !== null && state.count !== state.total) {
        return getFallbackText(locale, "resultSummary.filtered", {
            count: state.count,
            total: state.total
        });
    }

    const total = state.total ?? state.count;

    if (total === 1) {
        return getFallbackText(locale, "resultSummary.one");
    }

    if (total !== null) {
        return getFallbackText(locale, "resultSummary.total", { total });
    }

    return getFallbackText(locale, "resultSummary.empty");
}

/**
 * Creates a concise summary for result counts, filtered counts, or paginated ranges.
 */
export function ResultSummary(options: ResultSummaryOptions = {}): ComposedResultSummary {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "result-summary"
    }));
    const content = createElement("span", getCompositionElementOptions(options.contentOptions, {
        "data-af-result-summary-content": ""
    }));
    const contentSlot = createContentSlot(content);

    let total = normalizeCount(options.total);
    let count = normalizeCount(options.count);
    let explicitStart = normalizePositiveInteger(options.start);
    let explicitEnd = normalizePositiveInteger(options.end);
    let page = normalizePositiveInteger(options.page);
    let pageSize = normalizePositiveInteger(options.pageSize);
    let format = options.format ?? null;
    let live: ResultSummaryLiveMode = options.live ?? "off";
    let atomic = options.atomic ?? true;
    let locale: ResultSummaryLocalization | null = options.locale ?? null;
    let variant: ResultSummaryVariant = options.variant ?? "default";
    let size: ResultSummarySize = options.size ?? "md";
    let unsubscribeLocale: (() => void) | null = null;

    function getState(): ResultSummaryState {
        const inputExists = hasAnyResultInput(total, count, explicitStart, explicitEnd, page, pageSize);
        const hasNoResults = total === 0 || count === 0 || !inputExists;
        const start = hasNoResults
            ? null
            : getDerivedRangeStart(explicitStart, page, pageSize, total);
        const end = hasNoResults
            ? null
            : getDerivedRangeEnd(explicitEnd, start, count, pageSize, total);
        const hasRange = start !== null && end !== null;

        return {
            total,
            count,
            start,
            end,
            page,
            pageSize,
            empty: hasNoResults,
            hasRange
        };
    }

    function getRenderedContent(state: ResultSummaryState): ResultSummarySlotContent {
        if (format) {
            return normalizeSlotContent(format(state));
        }

        return getDefaultSummaryContent(state, locale);
    }

    function syncLiveRegion(): void {
        element.setAttribute("data-af-live", live);

        if (live === "off") {
            element.removeAttribute("aria-live");
            element.removeAttribute("aria-atomic");
            return;
        }

        element.setAttribute("aria-live", live);
        setElementAttributeValue(element, "aria-atomic", atomic ? "true" : null);
    }

    function sync(): void {
        const state = getState();
        const renderedContent = getRenderedContent(state);

        element.setAttribute("data-af-composition", "result-summary");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        content.setAttribute("data-af-result-summary-content", "");

        syncLiveRegion();
        contentSlot.set(toCompositionChildren(renderedContent));
        element.hidden = !hasCompositionContent(renderedContent);
    }

    function setTotal(nextTotal: number | null): void {
        total = normalizeCount(nextTotal);
        sync();
    }

    function setCount(nextCount: number | null): void {
        count = normalizeCount(nextCount);
        sync();
    }

    function setRange(
        start: number | null,
        end: number | null,
        nextTotal?: number | null
    ): void {
        explicitStart = normalizePositiveInteger(start);
        explicitEnd = normalizePositiveInteger(end);

        if (nextTotal !== undefined) {
            total = normalizeCount(nextTotal);
        }

        sync();
    }

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        if (!locale?.subscribe) return;

        unsubscribeLocale = locale.subscribe(() => {
            sync();
        });
    }

    syncLocaleSubscription();
    element.append(content);
    sync();

    return {
        element,
        content,
        getState,
        setTotal,
        setCount,
        setRange,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.contentOptions !== undefined) {
                applyCompositionElementOptions(content, nextOptions.contentOptions);
            }

            if ("total" in nextOptions) total = normalizeCount(nextOptions.total);
            if ("count" in nextOptions) count = normalizeCount(nextOptions.count);
            if ("start" in nextOptions) explicitStart = normalizePositiveInteger(nextOptions.start);
            if ("end" in nextOptions) explicitEnd = normalizePositiveInteger(nextOptions.end);
            if ("page" in nextOptions) page = normalizePositiveInteger(nextOptions.page);
            if ("pageSize" in nextOptions) pageSize = normalizePositiveInteger(nextOptions.pageSize);
            if ("format" in nextOptions) format = nextOptions.format ?? null;
            if (nextOptions.live !== undefined) live = nextOptions.live;
            if (nextOptions.atomic !== undefined) atomic = nextOptions.atomic;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;
            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                syncLocaleSubscription();
            }

            sync();
        },

        destroy(): void {
            unsubscribeLocale?.();
            unsubscribeLocale = null;
            contentSlot.dispose();
        }
    };
}
