import type { BreadcrumbsCurrent, BreadcrumbsItem } from "../breadcrumbs";
import type { DocumentMetadataUpdateOptions } from "../document-metadata";
import type { NavigationItem } from "../navigation";
import type { SearchBoxItem } from "../search-box";

/**
 * Minimal route metadata accepted by app route helpers.
 */
export interface AppRouteDescriptor {
    id: string;
    title: string;
    label?: string;
    href?: string | null;
    description?: string | null;
    keywords?: string[];
    disabled?: boolean;
    hint?: string | null;
    parentId?: string | null;
    documentTitle?: string | null;
    metadata?: DocumentMetadataUpdateOptions | null;
}

/**
 * SearchBox item generated from an application route.
 */
export interface AppRouteSearchItem<TRoute extends AppRouteDescriptor = AppRouteDescriptor>
    extends SearchBoxItem<TRoute> {
    data: TRoute;
}

/**
 * Resolves aria-current for a breadcrumb route.
 */
export type AppRouteCurrentResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute,
    index: number,
    routes: readonly TRoute[]
) => BreadcrumbsCurrent | undefined;

/**
 * Resolves display text for a route.
 */
export type AppRouteLabelResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string;

/**
 * Resolves link href for a route.
 */
export type AppRouteHrefResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string | null;

/**
 * Resolves navigation hint text for a route.
 */
export type AppRouteHintResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string | null;

/**
 * Resolves search description text for a route.
 */
export type AppRouteDescriptionResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string | null;

/**
 * Resolves extra search keywords for a route.
 */
export type AppRouteKeywordsResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string[];

/**
 * Resolves disabled state for a route.
 */
export type AppRouteDisabledResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => boolean;

/**
 * Resolves parent route id for route trail helpers.
 */
export type AppRouteParentIdResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string | null | undefined;

/**
 * Resolves the document title for a route.
 */
export type AppRouteDocumentTitleResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string | null;

/**
 * Resolves additional document metadata for a route.
 */
export type AppRouteMetadataResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => DocumentMetadataUpdateOptions | null | undefined;

/**
 * Options for deriving document metadata from route metadata.
 */
export interface AppRouteDocumentMetadataOptions<TRoute extends AppRouteDescriptor> {
    appTitle?: string | null;
    titleSeparator?: string;
    getTitle?: AppRouteDocumentTitleResolver<TRoute>;
    getDescription?: AppRouteDescriptionResolver<TRoute>;
    getMetadata?: AppRouteMetadataResolver<TRoute>;
}

/**
 * Options for createAppRouteNavigationItems().
 */
export interface AppRouteNavigationItemsOptions<TRoute extends AppRouteDescriptor> {
    getLabel?: AppRouteLabelResolver<TRoute>;
    getHref?: AppRouteHrefResolver<TRoute>;
    getHint?: AppRouteHintResolver<TRoute>;
    isDisabled?: AppRouteDisabledResolver<TRoute>;
}

/**
 * Options for createAppRouteSearchItems().
 */
export interface AppRouteSearchItemsOptions<TRoute extends AppRouteDescriptor> {
    getLabel?: AppRouteLabelResolver<TRoute>;
    getDescription?: AppRouteDescriptionResolver<TRoute>;
    getKeywords?: AppRouteKeywordsResolver<TRoute>;
    isDisabled?: AppRouteDisabledResolver<TRoute>;
}

/**
 * Options for createAppRouteBreadcrumbItems().
 */
export interface AppRouteBreadcrumbItemsOptions<TRoute extends AppRouteDescriptor> {
    getLabel?: AppRouteLabelResolver<TRoute>;
    getHref?: AppRouteHrefResolver<TRoute>;
    getCurrent?: AppRouteCurrentResolver<TRoute>;
    linkCurrent?: boolean;
}

/**
 * Options for createAppRouteTrail().
 */
export interface AppRouteTrailOptions<TRoute extends AppRouteDescriptor> {
    getParentId?: AppRouteParentIdResolver<TRoute>;
    includeSelf?: boolean;
}

/**
 * URL matching strategy for finding the current route from a browser location.
 */
export type AppRouteLocationMatchMode =
    | "auto"
    | "href"
    | "pathname"
    | "pathname-search"
    | "pathname-search-hash"
    | "hash";

/**
 * Location-like value accepted by app route matching helpers.
 */
export type AppRouteLocationInput = string | URL | Location;

/**
 * Options for getAppRouteByLocation().
 */
export interface AppRouteLocationMatchOptions<TRoute extends AppRouteDescriptor> {
    location?: AppRouteLocationInput;
    baseUrl?: string | URL;
    matchMode?: AppRouteLocationMatchMode;
    getHref?: AppRouteHrefResolver<TRoute>;
}

/**
 * Normalizes route text for search keywords.
 */
export function normalizeAppRouteText(value: string): string {
    return value
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Returns the default visible label for a route.
 */
export function getAppRouteLabel(route: AppRouteDescriptor): string {
    return route.label ?? route.title;
}

/**
 * Returns the default href for a route.
 * If href is explicitly null, the route is treated as not linkable.
 */
export function getAppRouteHref(route: AppRouteDescriptor): string | null {
    if ("href" in route) {
        return route.href ?? null;
    }

    return `#${encodeURIComponent(route.id)}`;
}

/**
 * Returns the default parent route id for a route.
 */
export function getAppRouteParentId(route: AppRouteDescriptor): string | null {
    if ("parentId" in route) {
        return route.parentId ?? null;
    }

    return null;
}

/**
 * Finds a route by id in a route list.
 */
export function getAppRouteById<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    id: string | null | undefined
): TRoute | null {
    if (!id) return null;

    return routes.find((route) => route.id === id) ?? null;
}

function getDefaultBaseUrl(): string | null {
    if (typeof document !== "undefined" && document.baseURI) {
        return document.baseURI;
    }

    if (typeof window !== "undefined") {
        return window.location.href;
    }

    return null;
}

function getLocationHref(location: AppRouteLocationInput | undefined): string | null {
    if (location === undefined) {
        return getDefaultBaseUrl();
    }

    return typeof location === "string" ? location : location.href;
}

function resolveAppRouteUrl(
    value: string,
    baseUrl: string | URL | undefined
): URL | null {
    const resolvedBaseUrl = baseUrl ?? getDefaultBaseUrl();

    if (!resolvedBaseUrl) return null;

    try {
        return new URL(value, resolvedBaseUrl);
    } catch {
        return null;
    }
}

function getRouteMatchMode(
    href: string,
    routeUrl: URL,
    explicitMode: AppRouteLocationMatchMode | undefined
): AppRouteLocationMatchMode {
    if (explicitMode && explicitMode !== "auto") {
        return explicitMode;
    }

    if (href.trim().startsWith("#")) return "hash";
    if (routeUrl.hash) return "pathname-search-hash";
    if (routeUrl.search) return "pathname-search";

    return "pathname";
}

function getUrlMatchValue(url: URL, mode: AppRouteLocationMatchMode): string {
    switch (mode) {
        case "href":
            return url.href;

        case "hash":
            return url.hash;

        case "pathname-search":
            return `${url.pathname}${url.search}`;

        case "pathname-search-hash":
            return `${url.pathname}${url.search}${url.hash}`;

        case "pathname":
        case "auto":
        default:
            return url.pathname;
    }
}

function isAppRouteLocationMatch(
    href: string,
    locationUrl: URL,
    options: Pick<
        AppRouteLocationMatchOptions<AppRouteDescriptor>,
        "baseUrl" | "matchMode"
    >
): boolean {
    const routeUrl = resolveAppRouteUrl(href, options.baseUrl);

    if (!routeUrl) return false;

    const mode = getRouteMatchMode(href, routeUrl, options.matchMode);

    return getUrlMatchValue(routeUrl, mode) === getUrlMatchValue(locationUrl, mode);
}
/**
 * Finds the route that matches a location URL.
 */
export function getAppRouteByLocation<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: AppRouteLocationMatchOptions<TRoute> = {}
): TRoute | null {
    const locationHref = getLocationHref(options.location);
    const locationUrl = locationHref
        ? resolveAppRouteUrl(locationHref, options.baseUrl)
        : null;

    if (!locationUrl) return null;

    return routes.find((route) => {
        const href = options.getHref?.(route) ?? getAppRouteHref(route);

        return href !== null && isAppRouteLocationMatch(href, locationUrl, options);
    }) ?? null;
}

/**
 * Creates a parent-to-current route trail from route metadata.
 */
export function createAppRouteTrail<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    routeOrId: TRoute | string | null | undefined,
    options: AppRouteTrailOptions<TRoute> = {}
): TRoute[] {
    const current: TRoute | null = typeof routeOrId === "string"
        ? getAppRouteById(routes, routeOrId)
        : routeOrId ?? null;

    if (!current) return [];

    const trail: TRoute[] = options.includeSelf === false ? [] : [current];
    const visited = new Set<string>([current.id]);

    let route: TRoute | null = current;

    while (route !== null) {
        const resolvedParentId: string | null | undefined = options.getParentId?.(route);
        const parentId: string | null = resolvedParentId ?? getAppRouteParentId(route);

        if (!parentId || visited.has(parentId)) break;

        visited.add(parentId);

        const parent: TRoute | null = getAppRouteById(routes, parentId);

        if (!parent) break;

        trail.unshift(parent);
        route = parent;
    }

    return trail;
}

/**
 * Returns default searchable keywords for a route.
 */
export function getAppRouteKeywords(
    route: AppRouteDescriptor,
    extraKeywords: string[] = []
): string[] {
    const label = getAppRouteLabel(route);

    return Array.from(new Set([
        route.id,
        route.title,
        label,
        normalizeAppRouteText(route.id),
        normalizeAppRouteText(route.title),
        normalizeAppRouteText(label),
        ...(route.keywords ?? []),
        ...extraKeywords
    ].filter(Boolean)));
}

/**
 * Returns the default search result description for a route.
 */
export function getAppRouteDescription(route: AppRouteDescriptor): string | null {
    if ("description" in route) {
        return route.description ?? null;
    }

    return `Open ${getAppRouteLabel(route)}.`;
}

/**
 * Returns the route description intended for document metadata.
 */
export function getAppRouteDocumentDescription(route: AppRouteDescriptor): string | null {
    if ("description" in route) {
        return route.description ?? null;
    }

    return null;
}

/**
 * Returns the document title for a route.
 */
export function getAppRouteDocumentTitle<TRoute extends AppRouteDescriptor>(
    route: TRoute,
    options: Pick<
        AppRouteDocumentMetadataOptions<TRoute>,
        "appTitle" | "titleSeparator" | "getTitle"
    > = {}
): string | null {
    const resolvedTitle = options.getTitle?.(route);

    if (resolvedTitle !== undefined) return resolvedTitle;

    const routeTitle = "documentTitle" in route && route.documentTitle !== undefined
        ? route.documentTitle
        : route.title;

    if (routeTitle === null) return null;

    const appTitle = options.appTitle ?? null;

    if (!appTitle) return routeTitle;

    return `${routeTitle} ${options.titleSeparator ?? "-"} ${appTitle}`;
}

/**
 * Creates document metadata update options from a route descriptor.
 */
export function createAppRouteDocumentMetadata<TRoute extends AppRouteDescriptor>(
    route: TRoute,
    options: AppRouteDocumentMetadataOptions<TRoute> = {}
): DocumentMetadataUpdateOptions {
    const resolvedMetadata = options.getMetadata?.(route);
    const routeMetadata = resolvedMetadata !== undefined
        ? resolvedMetadata
        : "metadata" in route
            ? route.metadata
            : null;

    const metadata: DocumentMetadataUpdateOptions = {
        ...(routeMetadata ?? {})
    };

    const title = getAppRouteDocumentTitle(route, options);
    const description = options.getDescription?.(route) ?? getAppRouteDocumentDescription(route);

    if (title !== null && metadata.title === undefined) {
        metadata.title = title;
    }

    if (description !== null && metadata.description === undefined) {
        metadata.description = description;
    }

    return metadata;
}

/**
 * Creates Navigation items from one route list.
 */
export function createAppRouteNavigationItems<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: AppRouteNavigationItemsOptions<TRoute> = {}
): NavigationItem[] {
    return routes.map((route) => {
        const item: NavigationItem = {
            id: route.id,
            label: options.getLabel?.(route) ?? getAppRouteLabel(route)
        };

        const href = options.getHref?.(route) ?? getAppRouteHref(route);
        const hint = options.getHint?.(route) ?? route.hint ?? null;
        const disabled = options.isDisabled?.(route) ?? route.disabled;

        if (href !== null) item.href = href;
        if (hint !== null) item.hint = hint;
        if (disabled !== undefined) item.disabled = disabled;

        return item;
    });
}

/**
 * Creates SearchBox items from one route list.
 */
export function createAppRouteSearchItems<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: AppRouteSearchItemsOptions<TRoute> = {}
): AppRouteSearchItem<TRoute>[] {
    return routes.map((route) => {
        const label = options.getLabel?.(route) ?? getAppRouteLabel(route);
        const description = options.getDescription?.(route) ?? getAppRouteDescription(route);
        const extraKeywords = options.getKeywords?.(route) ?? [];
        const disabled = options.isDisabled?.(route) ?? route.disabled;

        const item: AppRouteSearchItem<TRoute> = {
            id: route.id,
            label,
            keywords: getAppRouteKeywords(route, extraKeywords),
            data: route
        };

        if (description !== null) item.description = description;
        if (disabled !== undefined) item.disabled = disabled;

        return item;
    });
}

/**
 * Creates Breadcrumbs items from a route trail.
 */
export function createAppRouteBreadcrumbItems<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: AppRouteBreadcrumbItemsOptions<TRoute> = {}
): BreadcrumbsItem[] {
    const lastIndex = routes.length - 1;

    return routes.map((route, index) => {
        const current = options.getCurrent?.(route, index, routes)
            ?? (index === lastIndex ? "page" : false);

        const item: BreadcrumbsItem = {
            label: options.getLabel?.(route) ?? getAppRouteLabel(route)
        };

        const href = options.getHref?.(route) ?? getAppRouteHref(route);

        if (current) {
            item.current = current;
        }

        if (href !== null && (options.linkCurrent || !current)) {
            item.href = href;
        }

        return item;
    });
}
