import type { BreadcrumbsCurrent, BreadcrumbsItem } from "../breadcrumbs";
import type {
    DocumentMetadataStructuredData,
    DocumentMetadataUpdateOptions,
    DocumentMetadataUrlValue
} from "../document-metadata";
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
 * Resolves a canonical URL for a route.
 */
export type AppRouteCanonicalResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => DocumentMetadataUrlValue | null | undefined;

/**
 * Resolves JSON-LD structured data for a route.
 */
export type AppRouteStructuredDataResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => DocumentMetadataStructuredData | null | undefined;

/**
 * Options for deriving document metadata from route metadata.
 */
export interface AppRouteDocumentMetadataOptions<TRoute extends AppRouteDescriptor> {
    appTitle?: string | null;
    titleSeparator?: string;
    baseUrl?: string | URL | null;
    getHref?: AppRouteHrefResolver<TRoute>;
    getCanonical?: AppRouteCanonicalResolver<TRoute>;
    getStructuredData?: AppRouteStructuredDataResolver<TRoute>;
    getTitle?: AppRouteDocumentTitleResolver<TRoute>;
    getDescription?: AppRouteDescriptionResolver<TRoute>;
    getMetadata?: AppRouteMetadataResolver<TRoute>;
}

/**
 * Severity used by app route diagnostics.
 */
export type AppRouteDiagnosticsLevel = "info" | "warning" | "error";

/**
 * Route area checked by app route diagnostics.
 */
export type AppRouteDiagnosticsCategory =
    | "identity"
    | "hierarchy"
    | "link"
    | "metadata";

/**
 * Overall health status for a route diagnostics report.
 */
export type AppRouteDiagnosticsStatus =
    | "healthy"
    | "needs-attention"
    | "blocked";

/**
 * One route diagnostics finding.
 */
export interface AppRouteDiagnosticsIssue<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    level: AppRouteDiagnosticsLevel;
    category: AppRouteDiagnosticsCategory;
    code: string;
    message: string;
    route?: TRoute;
    relatedRoute?: TRoute;
}

/**
 * Options for inspectAppRoutes().
 */
export interface AppRouteDiagnosticsOptions<TRoute extends AppRouteDescriptor> {
    baseUrl?: string | URL | null;
    requireDescription?: boolean;
    requireDocumentTitle?: boolean;
    requireCanonical?: boolean;
    requireStructuredData?: boolean;
    getHref?: AppRouteHrefResolver<TRoute>;
    getParentId?: AppRouteParentIdResolver<TRoute>;
    getDescription?: AppRouteDescriptionResolver<TRoute>;
    getDocumentTitle?: AppRouteDocumentTitleResolver<TRoute>;
    getMetadata?: AppRouteMetadataResolver<TRoute>;
    getCanonical?: AppRouteCanonicalResolver<TRoute>;
    getStructuredData?: AppRouteStructuredDataResolver<TRoute>;
}

/**
 * Result returned by inspectAppRoutes().
 */
export interface AppRouteDiagnosticsReport<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    status: AppRouteDiagnosticsStatus;
    issues: Array<AppRouteDiagnosticsIssue<TRoute>>;
    errorCount: number;
    warningCount: number;
    infoCount: number;
}

/**
 * Strict route metadata checks recommended for public apps and indexed route sets.
 */
export const PUBLIC_APP_ROUTE_DIAGNOSTICS: Readonly<Pick<
    AppRouteDiagnosticsOptions<AppRouteDescriptor>,
    "requireDescription" | "requireDocumentTitle" | "requireCanonical" | "requireStructuredData"
>> = Object.freeze({
    requireDescription: true,
    requireDocumentTitle: true,
    requireCanonical: true,
    requireStructuredData: true
});

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

function getAppRouteResolvedMetadata<TRoute extends AppRouteDescriptor>(
    route: TRoute,
    options: Pick<AppRouteDocumentMetadataOptions<TRoute>, "getMetadata"> = {}
): DocumentMetadataUpdateOptions | null {
    const resolvedMetadata = options.getMetadata?.(route);

    if (resolvedMetadata !== undefined) return resolvedMetadata;

    return "metadata" in route ? route.metadata ?? null : null;
}

function stringifyAppRouteMetadataUrl(value: DocumentMetadataUrlValue): string {
    return typeof value === "string" ? value : value.toString();
}

function isAppRouteStructuredDataObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasAppRouteStructuredDataKeyword(value: unknown, keyword: string): boolean {
    if (isAppRouteStructuredDataObject(value)) return keyword in value;

    return Array.isArray(value)
        && value.some((item) => isAppRouteStructuredDataObject(item) && keyword in item);
}

function createAppRouteDiagnosticsIssue<TRoute extends AppRouteDescriptor>(
    level: AppRouteDiagnosticsLevel,
    category: AppRouteDiagnosticsCategory,
    code: string,
    message: string,
    route?: TRoute,
    relatedRoute?: TRoute
): AppRouteDiagnosticsIssue<TRoute> {
    const issue: AppRouteDiagnosticsIssue<TRoute> = {
        level,
        category,
        code,
        message
    };

    if (route !== undefined) issue.route = route;
    if (relatedRoute !== undefined) issue.relatedRoute = relatedRoute;

    return issue;
}

function getAppRouteDiagnosticsStatus(
    errorCount: number,
    warningCount: number
): AppRouteDiagnosticsStatus {
    if (errorCount > 0) return "blocked";
    if (warningCount > 0) return "needs-attention";

    return "healthy";
}

function hasAppRouteParentCycle<TRoute extends AppRouteDescriptor>(
    route: TRoute,
    routesById: Map<string, TRoute>,
    options: Pick<AppRouteDiagnosticsOptions<TRoute>, "getParentId">
): boolean {
    const visited = new Set<string>([route.id]);
    let current: TRoute | null = route;

    while (current !== null) {
        const resolvedParentId: string | null | undefined = options.getParentId?.(current);
        const parentId: string | null = resolvedParentId ?? getAppRouteParentId(current);

        if (!parentId) return false;
        if (visited.has(parentId)) return true;

        visited.add(parentId);
        current = routesById.get(parentId) ?? null;
    }

    return false;
}

/**
 * Creates route diagnostics options with public-app metadata requirements enabled.
 */
export function createPublicAppRouteDiagnosticsOptions<TRoute extends AppRouteDescriptor>(
    options: AppRouteDiagnosticsOptions<TRoute> = {}
): AppRouteDiagnosticsOptions<TRoute> {
    return {
        ...PUBLIC_APP_ROUTE_DIAGNOSTICS,
        ...options
    };
}

/**
 * Inspects route descriptors with public-app metadata requirements enabled.
 */
export function inspectPublicAppRoutes<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: AppRouteDiagnosticsOptions<TRoute> = {}
): AppRouteDiagnosticsReport<TRoute> {
    return inspectAppRoutes(routes, createPublicAppRouteDiagnosticsOptions(options));
}

/**
 * Inspects route descriptors for structural and metadata issues.
 */
export function inspectAppRoutes<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: AppRouteDiagnosticsOptions<TRoute> = {}
): AppRouteDiagnosticsReport<TRoute> {
    const issues: Array<AppRouteDiagnosticsIssue<TRoute>> = [];
    const routesById = new Map<string, TRoute>();
    const routesByHref = new Map<string, TRoute>();

    for (const route of routes) {
        const id = route.id.trim();
        const title = route.title.trim();

        if (!id) {
            issues.push(createAppRouteDiagnosticsIssue(
                "error",
                "identity",
                "route.id.empty",
                "Route id must not be empty.",
                route
            ));
        } else {
            const relatedRoute = routesById.get(id);

            if (relatedRoute) {
                issues.push(createAppRouteDiagnosticsIssue(
                    "error",
                    "identity",
                    "route.id.duplicate",
                    `Route id "${id}" is used more than once.`,
                    route,
                    relatedRoute
                ));
            } else {
                routesById.set(id, route);
            }
        }

        if (!title) {
            issues.push(createAppRouteDiagnosticsIssue(
                "warning",
                "identity",
                "route.title.empty",
                `Route "${route.id}" has an empty title.`,
                route
            ));
        }

        const href = options.getHref?.(route) ?? getAppRouteHref(route);

        if (href !== null) {
            const normalizedHref = href.trim();

            if (!normalizedHref) {
                issues.push(createAppRouteDiagnosticsIssue(
                    "warning",
                    "link",
                    "route.href.empty",
                    `Route "${route.id}" has an empty href.`,
                    route
                ));
            } else {
                const relatedRoute = routesByHref.get(normalizedHref);

                if (relatedRoute) {
                    issues.push(createAppRouteDiagnosticsIssue(
                        "warning",
                        "link",
                        "route.href.duplicate",
                        `Route href "${normalizedHref}" is used more than once.`,
                        route,
                        relatedRoute
                    ));
                } else {
                    routesByHref.set(normalizedHref, route);
                }
            }
        }

        const description = options.getDescription?.(route) ?? getAppRouteDocumentDescription(route);

        if (options.requireDescription && !description?.trim()) {
            issues.push(createAppRouteDiagnosticsIssue(
                "warning",
                "metadata",
                "route.description.missing",
                `Route "${route.id}" does not provide a document description.`,
                route
            ));
        }

        const documentTitle = options.getDocumentTitle?.(route) ?? getAppRouteDocumentTitle(route);

        if (options.requireDocumentTitle && !documentTitle?.trim()) {
            issues.push(createAppRouteDiagnosticsIssue(
                "warning",
                "metadata",
                "route.document-title.missing",
                `Route "${route.id}" does not provide a document title.`,
                route
            ));
        }

        const routeMetadata = getAppRouteResolvedMetadata(route, options);
        const canonical = routeMetadata?.canonical !== undefined
            ? routeMetadata.canonical
            : getAppRouteCanonical(route, options);

        if (options.requireCanonical && canonical === null) {
            issues.push(createAppRouteDiagnosticsIssue(
                "warning",
                "metadata",
                "route.canonical.missing",
                `Route "${route.id}" does not provide a canonical URL.`,
                route
            ));
        } else if (canonical !== null && !stringifyAppRouteMetadataUrl(canonical).trim()) {
            issues.push(createAppRouteDiagnosticsIssue(
                "warning",
                "metadata",
                "route.canonical.empty",
                `Route "${route.id}" has an empty canonical URL.`,
                route
            ));
        }

        const structuredData = routeMetadata?.structuredData !== undefined
            ? routeMetadata.structuredData
            : options.getStructuredData?.(route);

        if (options.requireStructuredData && (structuredData === undefined || structuredData === null)) {
            issues.push(createAppRouteDiagnosticsIssue(
                "warning",
                "metadata",
                "route.structured-data.missing",
                `Route "${route.id}" does not provide JSON-LD structured data.`,
                route
            ));
        }

        if (structuredData !== undefined && structuredData !== null) {
            if (!hasAppRouteStructuredDataKeyword(structuredData, "@context")) {
                issues.push(createAppRouteDiagnosticsIssue(
                    "info",
                    "metadata",
                    "route.structured-data.context.missing",
                    `Route "${route.id}" structured data should usually provide @context.`,
                    route
                ));
            }

            if (!hasAppRouteStructuredDataKeyword(structuredData, "@type")) {
                issues.push(createAppRouteDiagnosticsIssue(
                    "info",
                    "metadata",
                    "route.structured-data.type.missing",
                    `Route "${route.id}" structured data should usually provide @type.`,
                    route
                ));
            }
        }
    }

    for (const route of routes) {
        const parentId = options.getParentId?.(route) ?? getAppRouteParentId(route);

        if (parentId === null || parentId === undefined) continue;

        const normalizedParentId = parentId.trim();

        if (!normalizedParentId) {
            issues.push(createAppRouteDiagnosticsIssue(
                "warning",
                "hierarchy",
                "route.parent.empty",
                `Route "${route.id}" has an empty parent id.`,
                route
            ));
            continue;
        }

        if (normalizedParentId === route.id) {
            issues.push(createAppRouteDiagnosticsIssue(
                "error",
                "hierarchy",
                "route.parent.self",
                `Route "${route.id}" cannot be its own parent.`,
                route
            ));
            continue;
        }

        if (!routesById.has(normalizedParentId)) {
            issues.push(createAppRouteDiagnosticsIssue(
                "warning",
                "hierarchy",
                "route.parent.missing",
                `Route "${route.id}" references missing parent "${normalizedParentId}".`,
                route
            ));
            continue;
        }

        if (hasAppRouteParentCycle(route, routesById, options)) {
            issues.push(createAppRouteDiagnosticsIssue(
                "error",
                "hierarchy",
                "route.parent.cycle",
                `Route "${route.id}" is part of a parent route cycle.`,
                route
            ));
        }
    }

    const errorCount = issues.filter((issue) => issue.level === "error").length;
    const warningCount = issues.filter((issue) => issue.level === "warning").length;
    const infoCount = issues.filter((issue) => issue.level === "info").length;

    return {
        status: getAppRouteDiagnosticsStatus(errorCount, warningCount),
        issues,
        errorCount,
        warningCount,
        infoCount
    };
}

/**
 * Logs an app route diagnostics report to the developer console.
 */
export function logAppRouteDiagnostics<TRoute extends AppRouteDescriptor>(
    report: AppRouteDiagnosticsReport<TRoute>
): void {
    const summary = `[Accessible First] App route diagnostics: ${report.status} `
        + `(${report.errorCount} errors, ${report.warningCount} warnings, ${report.infoCount} info)`;

    if (report.errorCount > 0) console.error(summary);
    else if (report.warningCount > 0) console.warn(summary);
    else console.info(summary);

    for (const issue of report.issues) {
        const route = issue.route ? ` route=${issue.route.id}` : "";
        const related = issue.relatedRoute ? ` related=${issue.relatedRoute.id}` : "";
        const message = `[Accessible First] [${issue.level}] ${issue.category}/${issue.code}:${route}${related} ${issue.message}`;

        if (issue.level === "error") console.error(message);
        else if (issue.level === "warning") console.warn(message);
        else console.info(message);
    }
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
 * Returns a route canonical URL from a resolver or from baseUrl plus route href.
 */
export function getAppRouteCanonical<TRoute extends AppRouteDescriptor>(
    route: TRoute,
    options: Pick<
        AppRouteDocumentMetadataOptions<TRoute>,
        "baseUrl" | "getHref" | "getCanonical"
    > = {}
): DocumentMetadataUrlValue | null {
    const resolvedCanonical = options.getCanonical?.(route);

    if (resolvedCanonical !== undefined) return resolvedCanonical;

    const baseUrl = options.baseUrl ?? null;

    if (baseUrl === null) return null;

    const href = options.getHref?.(route) ?? getAppRouteHref(route);

    if (href === null) return null;

    const canonicalUrl = resolveAppRouteUrl(href, baseUrl);

    return canonicalUrl?.href ?? null;
}

/**
 * Creates document metadata update options from a route descriptor.
 */
export function createAppRouteDocumentMetadata<TRoute extends AppRouteDescriptor>(
    route: TRoute,
    options: AppRouteDocumentMetadataOptions<TRoute> = {}
): DocumentMetadataUpdateOptions {
    const routeMetadata = getAppRouteResolvedMetadata(route, options);

    const metadata: DocumentMetadataUpdateOptions = {
        ...(routeMetadata ?? {})
    };

    const title = getAppRouteDocumentTitle(route, options);
    const description = options.getDescription?.(route) ?? getAppRouteDocumentDescription(route);
    const canonical = getAppRouteCanonical(route, options);
    const structuredData = options.getStructuredData?.(route);

    if (title !== null && metadata.title === undefined) {
        metadata.title = title;
    }

    if (description !== null && metadata.description === undefined) {
        metadata.description = description;
    }

    if (canonical !== null && metadata.canonical === undefined) {
        metadata.canonical = canonical;
    }

    if (structuredData !== undefined && metadata.structuredData === undefined) {
        metadata.structuredData = structuredData;
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
