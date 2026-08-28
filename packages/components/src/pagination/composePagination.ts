import { createId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type ComposedNode,
    type ElementAttributes
} from "../composition";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";

/**
 * Visual variant for Pagination.
 */
export type PaginationVariant = "default" | "plain";

/**
 * Pagination size token.
 */
export type PaginationSize = "md";

/**
 * One rendered pagination item kind.
 */
export type PaginationItemKind = "previous" | "page" | "ellipsis" | "next";

/**
 * Localized message keys used by Pagination fallback labels.
 */
export type PaginationMessageKey =
    | "pagination.ellipsis"
    | "pagination.label"
    | "pagination.next"
    | "pagination.page"
    | "pagination.currentPage"
    | "pagination.previous";

/**
 * Localization provider accepted by Pagination.
 */
export type PaginationLocalization = LocaleTextProvider<PaginationMessageKey>;

/**
 * Context passed to pagination href and label resolvers.
 */
export interface PaginationPageContext {
    page: number;
    currentPage: number;
    pageCount: number;
}

/**
 * Resolves href for one pagination target. Return null to render a button/span instead of a link.
 */
export type PaginationHrefResolver = (context: PaginationPageContext) => string | null;

/**
 * Resolves the accessible label for one numeric page item.
 */
export type PaginationPageLabelResolver = (context: PaginationPageContext) => string;

/**
 * Details passed when Pagination requests a page change.
 */
export interface PaginationPageChangeDetail extends PaginationPageContext {
    previousPage: number;
    event: Event;
}

/**
 * Called when an enabled pagination control is activated.
 */
export type PaginationOnPageChange = (
    detail: PaginationPageChangeDetail,
    pagination: ComposedPagination
) => void;

/**
 * Options for Pagination().
 */
export interface PaginationOptions extends BaseCompositionOptions {
    page: number;
    pageCount: number;
    label?: string | null;
    labelledBy?: string | null;
    previousText?: string | null;
    nextText?: string | null;
    ellipsisText?: string | null;
    getPageLabel?: PaginationPageLabelResolver | null;
    getCurrentPageLabel?: PaginationPageLabelResolver | null;
    getHref?: PaginationHrefResolver | null;
    onPageChange?: PaginationOnPageChange | null;
    siblingCount?: number;
    boundaryCount?: number;
    disabled?: boolean;
    locale?: PaginationLocalization | null;
    variant?: PaginationVariant;
    size?: PaginationSize;
    listOptions?: BaseCompositionOptions;
    itemOptions?: BaseCompositionOptions;
    controlOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedPagination.update().
 */
export interface PaginationUpdateOptions extends Partial<PaginationOptions> {}

/**
 * One composed pagination item.
 */
export interface ComposedPaginationItem {
    readonly element: HTMLLIElement;
    readonly control: HTMLElement;
    readonly kind: PaginationItemKind;
    readonly page: number | null;
    isCurrent(): boolean;
    isDisabled(): boolean;
}

/**
 * Pagination navigation created by the composition API.
 */
export interface ComposedPagination extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly list: HTMLUListElement;
    readonly items: readonly ComposedPaginationItem[];
    getPage(): number;
    getPageCount(): number;
    setPage(page: number): void;
    setPageCount(pageCount: number): void;
    update(options: PaginationUpdateOptions): void;
    destroy(): void;
}

interface PaginationPageItemDefinition {
    kind: "page";
    page: number;
}

interface PaginationEllipsisItemDefinition {
    kind: "ellipsis";
}

type PaginationItemDefinition = PaginationPageItemDefinition | PaginationEllipsisItemDefinition;

interface PaginationControlDefinition {
    kind: PaginationItemKind;
    page: number | null;
    text: string;
    label: string | null;
    disabled: boolean;
    current: boolean;
}

interface PaginationItemNode {
    element: HTMLLIElement;
    control: HTMLElement;
    kind: PaginationItemKind;
    page: number | null;
    cleanup: (() => void) | null;
}

function clampInteger(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;

    return Math.min(Math.max(Math.round(value), min), max);
}

function normalizePageCount(pageCount: number): number {
    return clampInteger(pageCount, 1, Number.MAX_SAFE_INTEGER);
}

function normalizePage(page: number, pageCount: number): number {
    return clampInteger(page, 1, pageCount);
}

function normalizeCount(value: number | undefined, fallback: number): number {
    if (value === undefined) return fallback;
    if (!Number.isFinite(value)) return fallback;

    return Math.max(0, Math.round(value));
}

function range(start: number, end: number): number[] {
    const values: number[] = [];

    for (let value = start; value <= end; value += 1) {
        values.push(value);
    }

    return values;
}

function addPageRange(
    items: PaginationItemDefinition[],
    start: number,
    end: number
): void {
    for (const page of range(start, end)) {
        items.push({ kind: "page", page });
    }
}

function createPaginationItems(
    page: number,
    pageCount: number,
    siblingCount: number,
    boundaryCount: number
): PaginationItemDefinition[] {
    const totalVisibleNumbers = (boundaryCount * 2) + (siblingCount * 2) + 3;

    if (pageCount <= totalVisibleNumbers) {
        return range(1, pageCount).map((pageNumber) => ({
            kind: "page",
            page: pageNumber
        }));
    }

    const items: PaginationItemDefinition[] = [];
    const startBoundaryEnd = Math.min(boundaryCount, pageCount);
    const endBoundaryStart = Math.max(pageCount - boundaryCount + 1, startBoundaryEnd + 1);
    const siblingStart = Math.max(page - siblingCount, startBoundaryEnd + 1);
    const siblingEnd = Math.min(page + siblingCount, endBoundaryStart - 1);

    addPageRange(items, 1, startBoundaryEnd);

    if (siblingStart > startBoundaryEnd + 1) {
        items.push({ kind: "ellipsis" });
    } else {
        addPageRange(items, startBoundaryEnd + 1, siblingStart - 1);
    }

    addPageRange(items, siblingStart, siblingEnd);

    if (siblingEnd < endBoundaryStart - 1) {
        items.push({ kind: "ellipsis" });
    } else {
        addPageRange(items, siblingEnd + 1, endBoundaryStart - 1);
    }

    addPageRange(items, endBoundaryStart, pageCount);

    return items;
}

function getFallbackText(
    locale: PaginationLocalization | null,
    key: PaginationMessageKey,
    params?: Record<string, string | number | boolean | null | undefined>
): string {
    return getLocaleText(
        locale,
        key,
        accessibleFirstEnglishMessages[key],
        params
    );
}

function getPaginationLabel(
    label: string | null | undefined,
    locale: PaginationLocalization | null
): string | null {
    if (label === null) return null;

    return label ?? getFallbackText(locale, "pagination.label");
}

function getControlAttributes(
    definition: PaginationControlDefinition,
    href: string | null,
    controlOptions: BaseCompositionOptions | undefined
): ElementAttributes {
    const attributes: ElementAttributes = {
        ...(controlOptions?.attributes ?? {}),
        "data-af-pagination-control": "",
        "data-af-pagination-kind": definition.kind
    };

    if (href !== null && !definition.disabled && !definition.current) {
        attributes.href = href;
    }

    if (definition.label !== null) {
        attributes["aria-label"] = definition.label;
    }

    if (definition.current) {
        attributes["aria-current"] = "page";
    }

    if (definition.disabled) {
        attributes["aria-disabled"] = "true";
    }

    return attributes;
}

function createControlElement(
    definition: PaginationControlDefinition,
    href: string | null,
    controlOptions: BaseCompositionOptions | undefined
): HTMLElement {
    const tagName = href !== null && !definition.disabled && !definition.current
        ? "a"
        : definition.current || definition.kind === "ellipsis"
            ? "span"
            : "button";
    const element = createElement(tagName, getCompositionElementOptions(
        controlOptions,
        getControlAttributes(definition, href, controlOptions)
    ));

    element.textContent = definition.text;

    if (element instanceof HTMLButtonElement) {
        element.type = "button";
        element.disabled = definition.disabled;
    }

    return element;
}

function createComposedItem(node: PaginationItemNode): ComposedPaginationItem {
    return {
        element: node.element,
        control: node.control,
        kind: node.kind,
        page: node.page,

        isCurrent(): boolean {
            return node.control.getAttribute("aria-current") === "page";
        },

        isDisabled(): boolean {
            return node.control.getAttribute("aria-disabled") === "true"
                || (node.control instanceof HTMLButtonElement && node.control.disabled);
        }
    };
}

/**
 * Creates accessible pagination for SPA state changes or native-link page navigation.
 */
export function Pagination(options: PaginationOptions): ComposedPagination {
    const element = createElement("nav", getCompositionElementOptions(options, {
        "data-af-composition": "pagination"
    }));

    const list = createElement("ul", getCompositionElementOptions(options.listOptions, {
        "data-af-pagination-list": ""
    }));

    element.append(list);

    const composedItems: ComposedPaginationItem[] = [];

    let composed!: ComposedPagination;
    let pageCount = normalizePageCount(options.pageCount);
    let page = normalizePage(options.page, pageCount);
    let label = options.label;
    let labelledBy = options.labelledBy ?? null;
    let previousText = options.previousText ?? null;
    let nextText = options.nextText ?? null;
    let ellipsisText = options.ellipsisText ?? null;
    let getPageLabel = options.getPageLabel ?? null;
    let getCurrentPageLabel = options.getCurrentPageLabel ?? null;
    let getHref = options.getHref ?? null;
    let onPageChange = options.onPageChange ?? null;
    let siblingCount = normalizeCount(options.siblingCount, 1);
    let boundaryCount = normalizeCount(options.boundaryCount, 1);
    let disabled = options.disabled ?? false;
    let locale: PaginationLocalization | null = options.locale ?? null;
    let variant: PaginationVariant = options.variant ?? "default";
    let size: PaginationSize = options.size ?? "md";
    let itemOptions = options.itemOptions;
    let controlOptions = options.controlOptions;
    let itemNodes: PaginationItemNode[] = [];
    let unsubscribeLocale: (() => void) | null = null;

    function getPageContext(targetPage: number): PaginationPageContext {
        return {
            page: targetPage,
            currentPage: page,
            pageCount
        };
    }

    function getPreviousText(): string {
        return previousText ?? getFallbackText(locale, "pagination.previous");
    }

    function getNextText(): string {
        return nextText ?? getFallbackText(locale, "pagination.next");
    }

    function getEllipsisText(): string {
        return ellipsisText ?? getFallbackText(locale, "pagination.ellipsis");
    }

    function getPageAccessibleLabel(targetPage: number, current: boolean): string {
        const context = getPageContext(targetPage);

        if (current) {
            return getCurrentPageLabel?.(context)
                ?? getFallbackText(locale, "pagination.currentPage", { page: targetPage });
        }

        return getPageLabel?.(context)
            ?? getFallbackText(locale, "pagination.page", { page: targetPage });
    }

    function getHrefForPage(targetPage: number): string | null {
        return getHref?.(getPageContext(targetPage)) ?? null;
    }

    function sync(): void {
        element.setAttribute("data-af-composition", "pagination");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        list.setAttribute("data-af-pagination-list", "");

        const resolvedLabel = getPaginationLabel(label, locale);
        const trimmedLabel = resolvedLabel?.trim() ?? "";
        const trimmedLabelledBy = labelledBy?.trim() ?? "";

        if (trimmedLabelledBy) {
            element.removeAttribute("aria-label");
            element.setAttribute("aria-labelledby", trimmedLabelledBy);
        } else if (trimmedLabel) {
            element.setAttribute("aria-label", trimmedLabel);
            element.removeAttribute("aria-labelledby");
        } else {
            element.removeAttribute("aria-label");
            element.removeAttribute("aria-labelledby");
        }
    }

    function handlePageActivation(targetPage: number, event: Event): void {
        if (disabled || targetPage === page) return;

        const previousPage = page;

        onPageChange?.(
            {
                ...getPageContext(targetPage),
                previousPage,
                event
            },
            composed
        );
    }

    function disposeItems(): void {
        for (const node of [...itemNodes].reverse()) {
            node.cleanup?.();
        }

        itemNodes = [];
        composedItems.splice(0, composedItems.length);
        list.replaceChildren();
    }

    function createItemNode(definition: PaginationControlDefinition): PaginationItemNode {
        const element = createElement("li", getCompositionElementOptions(itemOptions, {
            "data-af-pagination-item": "",
            "data-af-pagination-kind": definition.kind
        }));
        const href = definition.page === null ? null : getHrefForPage(definition.page);
        const control = createControlElement(definition, href, controlOptions);
        let cleanup: (() => void) | null = null;

        if (definition.page !== null && !definition.disabled && !definition.current) {
            const targetPage = definition.page;
            const handleClick = (event: Event): void => {
                if (href !== null && !onPageChange) return;

                event.preventDefault();
                handlePageActivation(targetPage, event);
            };

            control.addEventListener("click", handleClick);
            cleanup = () => {
                control.removeEventListener("click", handleClick);
            };
        }

        element.append(control);

        return {
            element,
            control,
            kind: definition.kind,
            page: definition.page,
            cleanup
        };
    }

    function getControlDefinitions(): PaginationControlDefinition[] {
        const definitions: PaginationControlDefinition[] = [];
        const previousPage = Math.max(1, page - 1);
        const nextPage = Math.min(pageCount, page + 1);

        definitions.push({
            kind: "previous",
            page: previousPage,
            text: getPreviousText(),
            label: getPreviousText(),
            disabled: disabled || page <= 1,
            current: false
        });

        for (const item of createPaginationItems(page, pageCount, siblingCount, boundaryCount)) {
            if (item.kind === "ellipsis") {
                definitions.push({
                    kind: "ellipsis",
                    page: null,
                    text: getEllipsisText(),
                    label: getEllipsisText(),
                    disabled: true,
                    current: false
                });
                continue;
            }

            const current = item.page === page;

            definitions.push({
                kind: "page",
                page: item.page,
                text: String(item.page),
                label: getPageAccessibleLabel(item.page, current),
                disabled,
                current
            });
        }

        definitions.push({
            kind: "next",
            page: nextPage,
            text: getNextText(),
            label: getNextText(),
            disabled: disabled || page >= pageCount,
            current: false
        });

        return definitions;
    }

    function renderItems(): void {
        disposeItems();

        itemNodes = getControlDefinitions().map(createItemNode);

        for (const node of itemNodes) {
            list.append(node.element);
            composedItems.push(createComposedItem(node));
        }

        sync();
    }

    function setPage(nextPage: number): void {
        page = normalizePage(nextPage, pageCount);
        renderItems();
    }

    function setPageCount(nextPageCount: number): void {
        pageCount = normalizePageCount(nextPageCount);
        page = normalizePage(page, pageCount);
        renderItems();
    }

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        if (!locale?.subscribe) return;

        unsubscribeLocale = locale.subscribe(() => {
            renderItems();
        });
    }

    if (!element.id) {
        element.id = createId("af-pagination");
    }

    syncLocaleSubscription();
    renderItems();

    return composed = {
        element,
        list,
        items: composedItems,
        getPage(): number {
            return page;
        },
        getPageCount(): number {
            return pageCount;
        },
        setPage,
        setPageCount,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.listOptions !== undefined) {
                applyCompositionElementOptions(list, nextOptions.listOptions);
                list.setAttribute("data-af-pagination-list", "");
            }

            if ("label" in nextOptions) label = nextOptions.label;
            if ("labelledBy" in nextOptions) labelledBy = nextOptions.labelledBy ?? null;
            if ("previousText" in nextOptions) previousText = nextOptions.previousText ?? null;
            if ("nextText" in nextOptions) nextText = nextOptions.nextText ?? null;
            if ("ellipsisText" in nextOptions) ellipsisText = nextOptions.ellipsisText ?? null;
            if ("getPageLabel" in nextOptions) getPageLabel = nextOptions.getPageLabel ?? null;
            if ("getCurrentPageLabel" in nextOptions) getCurrentPageLabel = nextOptions.getCurrentPageLabel ?? null;
            if ("getHref" in nextOptions) getHref = nextOptions.getHref ?? null;
            if ("onPageChange" in nextOptions) onPageChange = nextOptions.onPageChange ?? null;
            if ("siblingCount" in nextOptions) siblingCount = normalizeCount(nextOptions.siblingCount, 1);
            if ("boundaryCount" in nextOptions) boundaryCount = normalizeCount(nextOptions.boundaryCount, 1);
            if ("disabled" in nextOptions) disabled = nextOptions.disabled ?? false;
            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                syncLocaleSubscription();
            }
            if ("itemOptions" in nextOptions) itemOptions = nextOptions.itemOptions;
            if ("controlOptions" in nextOptions) controlOptions = nextOptions.controlOptions;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            if (nextOptions.pageCount !== undefined) {
                pageCount = normalizePageCount(nextOptions.pageCount);
            }

            if (nextOptions.page !== undefined) {
                page = normalizePage(nextOptions.page, pageCount);
            } else {
                page = normalizePage(page, pageCount);
            }

            renderItems();
        },

        destroy(): void {
            unsubscribeLocale?.();
            unsubscribeLocale = null;
            disposeItems();
        }
    };
}


