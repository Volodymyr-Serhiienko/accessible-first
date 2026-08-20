import {
    getAppRouteCanonical,
    type AppRouteCanonicalResolver,
    type AppRouteDescriptor,
    type AppRouteHrefResolver
} from "./createAppRouteItems";
import type { DocumentMetadataUrlValue } from "../document-metadata";

const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";
const DEFAULT_MAX_SITEMAP_LOC_LENGTH = 2048;

const SITEMAP_CHANGE_FREQUENCIES = new Set<string>([
    "always",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "never"
]);

/**
 * Sitemap changefreq value from the Sitemap protocol.
 */
export type AppRouteSitemapChangeFrequency =
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";

/**
 * Sitemap lastmod value accepted by route sitemap helpers.
 */
export type AppRouteSitemapLastModified = string | Date;

/**
 * Decides whether a route should be included in sitemap entries.
 */
export type AppRouteSitemapRouteFilter<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => boolean;

/**
 * Resolves sitemap lastmod from a route.
 */
export type AppRouteSitemapLastModifiedResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => AppRouteSitemapLastModified | null | undefined;

/**
 * Resolves sitemap changefreq from a route.
 */
export type AppRouteSitemapChangeFrequencyResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => AppRouteSitemapChangeFrequency | null | undefined;

/**
 * Resolves sitemap priority from a route.
 */
export type AppRouteSitemapPriorityResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => number | null | undefined;

/**
 * One sitemap URL entry derived from a route.
 */
export interface AppRouteSitemapEntry<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    loc: string;
    lastmod?: string;
    changefreq?: AppRouteSitemapChangeFrequency;
    priority?: number;
    route?: TRoute;
}

/**
 * Options for createAppRouteSitemapEntries().
 */
export interface AppRouteSitemapEntriesOptions<TRoute extends AppRouteDescriptor> {
    baseUrl?: string | URL | null;
    getHref?: AppRouteHrefResolver<TRoute>;
    getCanonical?: AppRouteCanonicalResolver<TRoute>;
    includeRoute?: AppRouteSitemapRouteFilter<TRoute>;
    getLastModified?: AppRouteSitemapLastModifiedResolver<TRoute>;
    getChangeFrequency?: AppRouteSitemapChangeFrequencyResolver<TRoute>;
    getPriority?: AppRouteSitemapPriorityResolver<TRoute>;
}

/**
 * Options for createAppRouteSitemapXml().
 */
export interface AppRouteSitemapXmlOptions {
    pretty?: boolean;
}

/**
 * Severity used by route sitemap diagnostics.
 */
export type AppRouteSitemapDiagnosticsLevel = "info" | "warning" | "error";

/**
 * Area checked by route sitemap diagnostics.
 */
export type AppRouteSitemapDiagnosticsCategory =
    | "entry"
    | "url"
    | "metadata";

/**
 * Overall route sitemap diagnostics status.
 */
export type AppRouteSitemapDiagnosticsStatus =
    | "healthy"
    | "needs-attention"
    | "blocked";

/**
 * One route sitemap diagnostics finding.
 */
export interface AppRouteSitemapDiagnosticsIssue<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    level: AppRouteSitemapDiagnosticsLevel;
    category: AppRouteSitemapDiagnosticsCategory;
    code: string;
    message: string;
    entry?: AppRouteSitemapEntry<TRoute>;
    relatedEntry?: AppRouteSitemapEntry<TRoute>;
}

/**
 * Options for inspectAppRouteSitemap().
 */
export interface AppRouteSitemapDiagnosticsOptions {
    requireSingleHost?: boolean;
    allowHash?: boolean;
    maxLocLength?: number;
}

/**
 * Result returned by inspectAppRouteSitemap().
 */
export interface AppRouteSitemapDiagnosticsReport<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    status: AppRouteSitemapDiagnosticsStatus;
    issues: Array<AppRouteSitemapDiagnosticsIssue<TRoute>>;
    errorCount: number;
    warningCount: number;
    infoCount: number;
}

function stringifySitemapUrl(value: DocumentMetadataUrlValue): string {
    return typeof value === "string" ? value : value.toString();
}

function formatLastModified(value: AppRouteSitemapLastModified): string {
    return value instanceof Date ? value.toISOString() : value;
}

function shouldIncludeRoute<TRoute extends AppRouteDescriptor>(
    route: TRoute,
    options: AppRouteSitemapEntriesOptions<TRoute>
): boolean {
    return options.includeRoute?.(route) ?? !route.disabled;
}

function escapeXml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/'/g, "&apos;")
        .replace(/"/g, "&quot;")
        .replace(/>/g, "&gt;")
        .replace(/</g, "&lt;");
}

function getSitemapDiagnosticsStatus(
    errorCount: number,
    warningCount: number
): AppRouteSitemapDiagnosticsStatus {
    if (errorCount > 0) return "blocked";
    if (warningCount > 0) return "needs-attention";

    return "healthy";
}

function createSitemapIssue<TRoute extends AppRouteDescriptor>(
    level: AppRouteSitemapDiagnosticsLevel,
    category: AppRouteSitemapDiagnosticsCategory,
    code: string,
    message: string,
    entry?: AppRouteSitemapEntry<TRoute>,
    relatedEntry?: AppRouteSitemapEntry<TRoute>
): AppRouteSitemapDiagnosticsIssue<TRoute> {
    const issue: AppRouteSitemapDiagnosticsIssue<TRoute> = {
        level,
        category,
        code,
        message
    };

    if (entry !== undefined) issue.entry = entry;
    if (relatedEntry !== undefined) issue.relatedEntry = relatedEntry;

    return issue;
}

/**
 * Creates sitemap entries from route descriptors.
 */
export function createAppRouteSitemapEntries<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: AppRouteSitemapEntriesOptions<TRoute> = {}
): Array<AppRouteSitemapEntry<TRoute>> {
    const entries: Array<AppRouteSitemapEntry<TRoute>> = [];

    for (const route of routes) {
        if (!shouldIncludeRoute(route, options)) continue;

        const canonical = getAppRouteCanonical(route, options);

        if (canonical === null) continue;

        const entry: AppRouteSitemapEntry<TRoute> = {
            loc: stringifySitemapUrl(canonical),
            route
        };

        const lastmod = options.getLastModified?.(route);
        const changefreq = options.getChangeFrequency?.(route);
        const priority = options.getPriority?.(route);

        if (lastmod !== undefined && lastmod !== null) {
            entry.lastmod = formatLastModified(lastmod);
        }

        if (changefreq !== undefined && changefreq !== null) {
            entry.changefreq = changefreq;
        }

        if (priority !== undefined && priority !== null) {
            entry.priority = priority;
        }

        entries.push(entry);
    }

    return entries;
}

/**
 * Creates Sitemap protocol XML from sitemap entries.
 */
export function createAppRouteSitemapXml(
    entries: readonly AppRouteSitemapEntry[],
    options: AppRouteSitemapXmlOptions = {}
): string {
    const pretty = options.pretty ?? true;
    const lines: string[] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<urlset xmlns="${SITEMAP_NAMESPACE}">`
    ];

    for (const entry of entries) {
        lines.push("  <url>");
        lines.push(`    <loc>${escapeXml(entry.loc)}</loc>`);

        if (entry.lastmod !== undefined) {
            lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
        }

        if (entry.changefreq !== undefined) {
            lines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`);
        }

        if (entry.priority !== undefined) {
            lines.push(`    <priority>${entry.priority}</priority>`);
        }

        lines.push("  </url>");
    }

    lines.push("</urlset>");

    return pretty
        ? lines.join("\n")
        : lines.map((line) => line.trim()).join("");
}

/**
 * Inspects sitemap entries for common Sitemap protocol issues.
 */
export function inspectAppRouteSitemap<TRoute extends AppRouteDescriptor>(
    entries: readonly AppRouteSitemapEntry<TRoute>[],
    options: AppRouteSitemapDiagnosticsOptions = {}
): AppRouteSitemapDiagnosticsReport<TRoute> {
    const issues: Array<AppRouteSitemapDiagnosticsIssue<TRoute>> = [];
    const entriesByLoc = new Map<string, AppRouteSitemapEntry<TRoute>>();
    const maxLocLength = options.maxLocLength ?? DEFAULT_MAX_SITEMAP_LOC_LENGTH;
    const requireSingleHost = options.requireSingleHost ?? true;
    const allowHash = options.allowHash ?? false;

    let host: string | null = null;

    if (entries.length === 0) {
        issues.push(createSitemapIssue(
            "warning",
            "entry",
            "sitemap.empty",
            "Sitemap has no entries."
        ));
    }

    for (const entry of entries) {
        const loc = entry.loc.trim();

        if (!loc) {
            issues.push(createSitemapIssue(
                "error",
                "url",
                "sitemap.loc.empty",
                "Sitemap entry loc must not be empty.",
                entry
            ));
            continue;
        }

        const relatedEntry = entriesByLoc.get(loc);

        if (relatedEntry) {
            issues.push(createSitemapIssue(
                "warning",
                "url",
                "sitemap.loc.duplicate",
                `Sitemap loc "${loc}" is used more than once.`,
                entry,
                relatedEntry
            ));
        } else {
            entriesByLoc.set(loc, entry);
        }

        if (loc.length > maxLocLength) {
            issues.push(createSitemapIssue(
                "warning",
                "url",
                "sitemap.loc.too-long",
                `Sitemap loc is longer than ${maxLocLength} characters.`,
                entry
            ));
        }

        let url: URL;

        try {
            url = new URL(loc);
        } catch {
            issues.push(createSitemapIssue(
                "error",
                "url",
                "sitemap.loc.invalid",
                `Sitemap loc "${loc}" is not a valid absolute URL.`,
                entry
            ));
            continue;
        }

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            issues.push(createSitemapIssue(
                "error",
                "url",
                "sitemap.loc.protocol",
                "Sitemap loc should use http or https.",
                entry
            ));
        }

        if (!allowHash && url.hash) {
            issues.push(createSitemapIssue(
                "info",
                "url",
                "sitemap.loc.hash",
                "Sitemap loc contains a hash. Hash routes are usually not independent crawlable pages.",
                entry
            ));
        }

        if (requireSingleHost) {
            if (host === null) {
                host = url.host;
            } else if (url.host !== host) {
                issues.push(createSitemapIssue(
                    "warning",
                    "url",
                    "sitemap.loc.host",
                    "All URLs in one sitemap should belong to one host.",
                    entry
                ));
            }
        }

        if (entry.lastmod !== undefined) {
            const lastmod = entry.lastmod.trim();

            if (!lastmod) {
                issues.push(createSitemapIssue(
                    "warning",
                    "metadata",
                    "sitemap.lastmod.empty",
                    "Sitemap lastmod must not be empty when provided.",
                    entry
                ));
            } else if (Number.isNaN(Date.parse(lastmod))) {
                issues.push(createSitemapIssue(
                    "warning",
                    "metadata",
                    "sitemap.lastmod.invalid",
                    "Sitemap lastmod should be a valid W3C datetime or YYYY-MM-DD date.",
                    entry
                ));
            }
        }

        if (
            entry.changefreq !== undefined
            && !SITEMAP_CHANGE_FREQUENCIES.has(entry.changefreq)
        ) {
            issues.push(createSitemapIssue(
                "warning",
                "metadata",
                "sitemap.changefreq.invalid",
                "Sitemap changefreq is not a valid Sitemap protocol value.",
                entry
            ));
        }

        if (
            entry.priority !== undefined
            && (!Number.isFinite(entry.priority) || entry.priority < 0 || entry.priority > 1)
        ) {
            issues.push(createSitemapIssue(
                "warning",
                "metadata",
                "sitemap.priority.invalid",
                "Sitemap priority should be between 0 and 1.",
                entry
            ));
        }
    }

    const errorCount = issues.filter((issue) => issue.level === "error").length;
    const warningCount = issues.filter((issue) => issue.level === "warning").length;
    const infoCount = issues.filter((issue) => issue.level === "info").length;

    return {
        status: getSitemapDiagnosticsStatus(errorCount, warningCount),
        issues,
        errorCount,
        warningCount,
        infoCount
    };
}

/**
 * Logs an app route sitemap diagnostics report to the developer console.
 */
export function logAppRouteSitemapDiagnostics<TRoute extends AppRouteDescriptor>(
    report: AppRouteSitemapDiagnosticsReport<TRoute>
): void {
    console.groupCollapsed("Accessible First App Route Sitemap Report");
    console.log(`Status: ${report.status}`);
    console.log(`Errors: ${report.errorCount}`);
    console.log(`Warnings: ${report.warningCount}`);
    console.log(`Info: ${report.infoCount}`);

    for (const issue of report.issues) {
        const route = issue.entry?.route ? ` route=${issue.entry.route.id}` : "";
        const message = `[${issue.level}] ${issue.category}/${issue.code}:${route} ${issue.message}`;

        if (issue.level === "error") console.error(message, issue.entry ?? "");
        else if (issue.level === "warning") console.warn(message, issue.entry ?? "");
        else console.info(message, issue.entry ?? "");
    }

    console.groupEnd();
}
