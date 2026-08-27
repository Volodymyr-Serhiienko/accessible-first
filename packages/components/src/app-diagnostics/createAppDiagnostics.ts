import type { AppRouteDiagnosticsReport } from "../app-routes";
import type { PageDiagnosticsReport } from "../page";

/**
 * Severity level understood by app diagnostics.
 */
export type AppDiagnosticsLevel = "info" | "warning" | "error";

/**
 * Overall app diagnostics status.
 */
export type AppDiagnosticsStatus = "healthy" | "needs-attention" | "blocked";

/**
 * Minimal issue shape accepted from diagnostics reports.
 */
export interface AppDiagnosticsIssueLike {
    level?: AppDiagnosticsLevel | string;
}

/**
 * Minimal report shape accepted by AppDiagnostics.
 */
export interface AppDiagnosticsCompatibleReport {
    status?: AppDiagnosticsStatus | string;
    issues?: readonly AppDiagnosticsIssueLike[];
    errorCount?: number;
    warningCount?: number;
    infoCount?: number;
}

/**
 * One diagnostics source passed into createAppDiagnosticsReport().
 */
export interface AppDiagnosticsSourceOptions {
    id: string;
    label?: string;
    report?: AppDiagnosticsCompatibleReport | null;
}

/**
 * Normalized diagnostics source stored in the app report.
 */
export interface AppDiagnosticsSourceReport {
    id: string;
    label?: string;
    status: AppDiagnosticsStatus;
    report: AppDiagnosticsCompatibleReport;
    issueCount: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
}

/**
 * Options for createAppDiagnosticsReport().
 */
export interface AppDiagnosticsOptions {
    page?: PageDiagnosticsReport | null;
    routes?: AppRouteDiagnosticsReport | null;
    sources?: readonly AppDiagnosticsSourceOptions[];
}

/**
 * Static or lazy diagnostics report accepted by createAppDiagnosticsRunner().
 */
export type AppDiagnosticsReportResolver<
    TReport extends AppDiagnosticsCompatibleReport = AppDiagnosticsCompatibleReport
> = TReport | null | undefined | (() => TReport | null | undefined);

/**
 * Static or lazy custom diagnostics sources accepted by createAppDiagnosticsRunner().
 */
export type AppDiagnosticsSourcesResolver =
    | readonly AppDiagnosticsSourceOptions[]
    | null
    | undefined
    | (() => readonly AppDiagnosticsSourceOptions[] | null | undefined);

/**
 * Logging behavior for createAppDiagnosticsRunner().
 */
export type AppDiagnosticsRunnerLog = boolean | ((report: AppDiagnosticsReport) => void);

/**
 * Options for createAppDiagnosticsRunner().
 */
export interface AppDiagnosticsRunnerOptions {
    page?: AppDiagnosticsReportResolver<PageDiagnosticsReport>;
    routes?: AppDiagnosticsReportResolver<AppRouteDiagnosticsReport>;
    sources?: AppDiagnosticsSourcesResolver;
    log?: AppDiagnosticsRunnerLog;
}

/**
 * Combined app diagnostics report.
 */
export interface AppDiagnosticsReport {
    status: AppDiagnosticsStatus;
    sources: AppDiagnosticsSourceReport[];
    issueCount: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
}

/**
 * Reusable app diagnostics controller for declarative app setup.
 */
export interface AppDiagnosticsRunner {
    inspect(): AppDiagnosticsReport;
    log(): AppDiagnosticsReport;
}

function getAppDiagnosticsStatus(
    errorCount: number,
    warningCount: number
): AppDiagnosticsStatus {
    if (errorCount > 0) return "blocked";
    if (warningCount > 0) return "needs-attention";

    return "healthy";
}

function countIssuesByLevel(
    report: AppDiagnosticsCompatibleReport,
    level: AppDiagnosticsLevel
): number {
    return report.issues?.filter((issue) => issue.level === level).length ?? 0;
}

function normalizeReportStatus(
    report: AppDiagnosticsCompatibleReport,
    errorCount: number,
    warningCount: number
): AppDiagnosticsStatus {
    if (
        report.status === "healthy"
        || report.status === "needs-attention"
        || report.status === "blocked"
    ) {
        return report.status;
    }

    return getAppDiagnosticsStatus(errorCount, warningCount);
}

function resolveAppDiagnosticsReport<
    TReport extends AppDiagnosticsCompatibleReport
>(
    resolver: AppDiagnosticsReportResolver<TReport>
): TReport | null {
    if (typeof resolver === "function") {
        return resolver() ?? null;
    }

    return resolver ?? null;
}

function resolveAppDiagnosticsSources(
    resolver: AppDiagnosticsSourcesResolver
): readonly AppDiagnosticsSourceOptions[] {
    const sources = typeof resolver === "function"
        ? resolver()
        : resolver;

    return sources ?? [];
}

/**
 * Normalizes one diagnostics source.
 */
export function createAppDiagnosticsSourceReport(
    options: AppDiagnosticsSourceOptions
): AppDiagnosticsSourceReport | null {
    const report = options.report ?? null;

    if (!report) return null;

    const errorCount = report.errorCount ?? countIssuesByLevel(report, "error");
    const warningCount = report.warningCount ?? countIssuesByLevel(report, "warning");
    const infoCount = report.infoCount ?? countIssuesByLevel(report, "info");
    const issueCount = report.issues?.length ?? errorCount + warningCount + infoCount;

    const source: AppDiagnosticsSourceReport = {
        id: options.id,
        status: normalizeReportStatus(report, errorCount, warningCount),
        report,
        issueCount,
        errorCount,
        warningCount,
        infoCount
    };

    if (options.label !== undefined) source.label = options.label;

    return source;
}

/**
 * Combines page, route, and custom diagnostics into one app-level report.
 */
export function createAppDiagnosticsReport(
    options: AppDiagnosticsOptions = {}
): AppDiagnosticsReport {
    const sourceOptions: AppDiagnosticsSourceOptions[] = [];

    if (options.page) {
        sourceOptions.push({ id: "page", label: "Page", report: options.page });
    }

    if (options.routes) {
        sourceOptions.push({ id: "routes", label: "Routes", report: options.routes });
    }

    sourceOptions.push(...(options.sources ?? []));

    const sources = sourceOptions
        .map(createAppDiagnosticsSourceReport)
        .filter((source): source is AppDiagnosticsSourceReport => source !== null);

    const errorCount = sources.reduce((total, source) => total + source.errorCount, 0);
    const warningCount = sources.reduce((total, source) => total + source.warningCount, 0);
    const infoCount = sources.reduce((total, source) => total + source.infoCount, 0);
    const issueCount = sources.reduce((total, source) => total + source.issueCount, 0);

    return {
        status: getAppDiagnosticsStatus(errorCount, warningCount),
        sources,
        issueCount,
        errorCount,
        warningCount,
        infoCount
    };
}

/**
 * Creates a reusable diagnostics runner for apps that need fresh reports on demand.
 */
export function createAppDiagnosticsRunner(
    options: AppDiagnosticsRunnerOptions = {}
): AppDiagnosticsRunner {
    function inspect(): AppDiagnosticsReport {
        const page = resolveAppDiagnosticsReport(options.page);
        const routes = resolveAppDiagnosticsReport(options.routes);
        const sources = resolveAppDiagnosticsSources(options.sources);
        const reportOptions: AppDiagnosticsOptions = {};

        if (page) reportOptions.page = page;
        if (routes) reportOptions.routes = routes;
        if (sources.length > 0) reportOptions.sources = sources;

        return createAppDiagnosticsReport(reportOptions);
    }

    function log(): AppDiagnosticsReport {
        const report = inspect();
        const logOption = options.log;

        if (typeof logOption === "function") {
            logOption(report);
        } else if (logOption !== false) {
            logAppDiagnostics(report);
        }

        return report;
    }

    return {
        inspect,
        log
    };
}

/**
 * Logs an app diagnostics report to the developer console.
 */
export function logAppDiagnostics(report: AppDiagnosticsReport): void {
    console.groupCollapsed("Accessible First App Report");
    console.log(`Status: ${report.status}`);
    console.log(`Sources: ${report.sources.length}`);
    console.log(`Errors: ${report.errorCount}`);
    console.log(`Warnings: ${report.warningCount}`);
    console.log(`Info: ${report.infoCount}`);

    for (const source of report.sources) {
        const label = source.label ?? source.id;
        const line = `[${source.status}] ${label}: `
            + `${source.errorCount} errors, ${source.warningCount} warnings, ${source.infoCount} info`;

        if (source.status === "blocked") console.error(line, source.report);
        else if (source.status === "needs-attention") console.warn(line, source.report);
        else console.info(line, source.report);
    }

    console.groupEnd();
}
