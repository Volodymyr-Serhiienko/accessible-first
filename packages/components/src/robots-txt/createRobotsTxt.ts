import type { DocumentMetadataUrlValue } from "../document-metadata";

/**
 * Robots.txt user-agent token. Use "*" for all crawlers.
 */
export type RobotsTxtUserAgent = string;

/**
 * Robots.txt path pattern used by Allow and Disallow.
 */
export type RobotsTxtPath = string;

/**
 * One robots.txt crawler rule group.
 */
export interface RobotsTxtGroupOptions {
    userAgent: RobotsTxtUserAgent | readonly RobotsTxtUserAgent[];
    allow?: readonly RobotsTxtPath[];
    disallow?: readonly RobotsTxtPath[];
    comments?: readonly string[];
}

/**
 * Options for createRobotsTxt().
 */
export interface RobotsTxtOptions {
    comments?: readonly string[];
    groups?: readonly RobotsTxtGroupOptions[];
    sitemaps?: readonly DocumentMetadataUrlValue[];
    trailingNewline?: boolean;
}

/**
 * Severity used by robots.txt diagnostics.
 */
export type RobotsTxtDiagnosticsLevel = "info" | "warning" | "error";

/**
 * Area checked by robots.txt diagnostics.
 */
export type RobotsTxtDiagnosticsCategory = "group" | "rule" | "sitemap";

/**
 * Overall robots.txt diagnostics status.
 */
export type RobotsTxtDiagnosticsStatus = "healthy" | "needs-attention" | "blocked";

/**
 * One robots.txt diagnostics finding.
 */
export interface RobotsTxtDiagnosticsIssue {
    level: RobotsTxtDiagnosticsLevel;
    category: RobotsTxtDiagnosticsCategory;
    code: string;
    message: string;
    group?: RobotsTxtGroupOptions;
    sitemap?: DocumentMetadataUrlValue;
}

/**
 * Options for inspectRobotsTxtOptions().
 */
export interface RobotsTxtDiagnosticsOptions {
    requireGroup?: boolean;
    requireSitemap?: boolean;
}

/**
 * Result returned by inspectRobotsTxtOptions().
 */
export interface RobotsTxtDiagnosticsReport {
    status: RobotsTxtDiagnosticsStatus;
    issues: RobotsTxtDiagnosticsIssue[];
    errorCount: number;
    warningCount: number;
    infoCount: number;
}

function isUserAgentArray(
    value: RobotsTxtGroupOptions["userAgent"]
): value is readonly RobotsTxtUserAgent[] {
    return Array.isArray(value);
}

function toUserAgentArray(
    value: RobotsTxtGroupOptions["userAgent"]
): readonly RobotsTxtUserAgent[] {
    return isUserAgentArray(value) ? value : [value];
}
function sanitizeLine(value: string): string {
    return value.replace(/[\r\n]+/g, " ").trim();
}

function stringifyUrl(value: DocumentMetadataUrlValue): string {
    return typeof value === "string" ? value : value.toString();
}

function appendComments(lines: string[], comments: readonly string[] | undefined): void {
    for (const comment of comments ?? []) {
        const text = sanitizeLine(comment);

        if (text) lines.push(`# ${text}`);
    }
}

function appendBlankLine(lines: string[]): void {
    if (lines.length > 0 && lines[lines.length - 1] !== "") {
        lines.push("");
    }
}

function getDiagnosticsStatus(
    errorCount: number,
    warningCount: number
): RobotsTxtDiagnosticsStatus {
    if (errorCount > 0) return "blocked";
    if (warningCount > 0) return "needs-attention";

    return "healthy";
}

function createIssue(
    level: RobotsTxtDiagnosticsLevel,
    category: RobotsTxtDiagnosticsCategory,
    code: string,
    message: string,
    group?: RobotsTxtGroupOptions,
    sitemap?: DocumentMetadataUrlValue
): RobotsTxtDiagnosticsIssue {
    const issue: RobotsTxtDiagnosticsIssue = { level, category, code, message };

    if (group !== undefined) issue.group = group;
    if (sitemap !== undefined) issue.sitemap = sitemap;

    return issue;
}

function isValidUserAgent(value: string): boolean {
    return value === "*" || /^[A-Za-z_-]+$/.test(value);
}

function isValidPathRule(value: string): boolean {
    return value === "" || value.startsWith("/");
}

/**
 * Creates robots.txt content from typed options.
 */
export function createRobotsTxt(options: RobotsTxtOptions = {}): string {
    const lines: string[] = [];

    appendComments(lines, options.comments);

    for (const group of options.groups ?? []) {
        appendBlankLine(lines);
        appendComments(lines, group.comments);

        for (const userAgent of toUserAgentArray(group.userAgent)) {
            lines.push(`User-agent: ${sanitizeLine(userAgent)}`);
        }

        for (const path of group.allow ?? []) {
            lines.push(`Allow: ${sanitizeLine(path)}`);
        }

        for (const path of group.disallow ?? []) {
            lines.push(`Disallow: ${sanitizeLine(path)}`);
        }
    }

    if (options.sitemaps?.length) {
        appendBlankLine(lines);

        for (const sitemap of options.sitemaps) {
            lines.push(`Sitemap: ${sanitizeLine(stringifyUrl(sitemap))}`);
        }
    }

    const text = lines.join("\n");

    if (!text) return "";

    return options.trailingNewline ?? true ? `${text}\n` : text;
}

/**
 * Inspects robots.txt options before generating a deployable file.
 */
export function inspectRobotsTxtOptions(
    options: RobotsTxtOptions = {},
    diagnosticsOptions: RobotsTxtDiagnosticsOptions = {}
): RobotsTxtDiagnosticsReport {
    const issues: RobotsTxtDiagnosticsIssue[] = [];
    const groups = options.groups ?? [];
    const sitemaps = options.sitemaps ?? [];
    const sitemapUrls = new Set<string>();

    if (diagnosticsOptions.requireGroup && groups.length === 0) {
        issues.push(createIssue(
            "warning",
            "group",
            "robots.group.missing",
            "robots.txt should define at least one user-agent group."
        ));
    }

    if (diagnosticsOptions.requireSitemap && sitemaps.length === 0) {
        issues.push(createIssue(
            "warning",
            "sitemap",
            "robots.sitemap.missing",
            "Public robots.txt should reference a sitemap URL."
        ));
    }

    for (const group of groups) {
        const userAgents = toUserAgentArray(group.userAgent);

        if (userAgents.length === 0) {
            issues.push(createIssue(
                "error",
                "group",
                "robots.user-agent.missing",
                "Robots group must include at least one user-agent.",
                group
            ));
        }

        for (const userAgent of userAgents) {
            const normalized = userAgent.trim();

            if (!normalized) {
                issues.push(createIssue(
                    "error",
                    "group",
                    "robots.user-agent.empty",
                    "User-agent must not be empty.",
                    group
                ));
            } else if (!isValidUserAgent(normalized)) {
                issues.push(createIssue(
                    "warning",
                    "group",
                    "robots.user-agent.invalid",
                    "User-agent should be '*' or a product token containing letters, hyphens, and underscores.",
                    group
                ));
            }
        }

        for (const path of [...(group.allow ?? []), ...(group.disallow ?? [])]) {
            if (/[\r\n]/.test(path)) {
                issues.push(createIssue(
                    "error",
                    "rule",
                    "robots.rule.multiline",
                    "Robots rule paths must not contain line breaks.",
                    group
                ));
            }

            if (!isValidPathRule(path.trim())) {
                issues.push(createIssue(
                    "warning",
                    "rule",
                    "robots.rule.path",
                    "Robots rule paths should be empty or start with '/'.",
                    group
                ));
            }
        }
    }

    for (const sitemap of sitemaps) {
        const value = stringifyUrl(sitemap).trim();

        if (!value) {
            issues.push(createIssue(
                "error",
                "sitemap",
                "robots.sitemap.empty",
                "Sitemap URL must not be empty.",
                undefined,
                sitemap
            ));
            continue;
        }

        if (sitemapUrls.has(value)) {
            issues.push(createIssue(
                "warning",
                "sitemap",
                "robots.sitemap.duplicate",
                `Sitemap URL "${value}" is used more than once.`,
                undefined,
                sitemap
            ));
        } else {
            sitemapUrls.add(value);
        }

        let url: URL;

        try {
            url = new URL(value);
        } catch {
            issues.push(createIssue(
                "error",
                "sitemap",
                "robots.sitemap.invalid",
                `Sitemap URL "${value}" is not a valid absolute URL.`,
                undefined,
                sitemap
            ));
            continue;
        }

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            issues.push(createIssue(
                "error",
                "sitemap",
                "robots.sitemap.protocol",
                "Sitemap URL should use http or https.",
                undefined,
                sitemap
            ));
        }
    }

    const errorCount = issues.filter((issue) => issue.level === "error").length;
    const warningCount = issues.filter((issue) => issue.level === "warning").length;
    const infoCount = issues.filter((issue) => issue.level === "info").length;

    return {
        status: getDiagnosticsStatus(errorCount, warningCount),
        issues,
        errorCount,
        warningCount,
        infoCount
    };
}

/**
 * Logs a robots.txt diagnostics report to the developer console.
 */
export function logRobotsTxtDiagnostics(report: RobotsTxtDiagnosticsReport): void {
    console.groupCollapsed("Accessible First RobotsTxt Report");
    console.log(`Status: ${report.status}`);
    console.log(`Errors: ${report.errorCount}`);
    console.log(`Warnings: ${report.warningCount}`);
    console.log(`Info: ${report.infoCount}`);

    for (const issue of report.issues) {
        const message = `[${issue.level}] ${issue.category}/${issue.code}: ${issue.message}`;

        if (issue.level === "error") console.error(message, issue.group ?? issue.sitemap ?? "");
        else if (issue.level === "warning") console.warn(message, issue.group ?? issue.sitemap ?? "");
        else console.info(message, issue.group ?? issue.sitemap ?? "");
    }

    console.groupEnd();
}
