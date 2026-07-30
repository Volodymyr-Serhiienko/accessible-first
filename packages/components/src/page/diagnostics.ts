import type {
    PageDiagnosticsIssue,
    PageDiagnosticsOptions,
    PageDiagnosticsReport,
    PageDiagnosticsStatus
} from "./types";

function createIssue(
    level: PageDiagnosticsIssue["level"],
    code: string,
    message: string,
    element?: HTMLElement
): PageDiagnosticsIssue {
    const issue: PageDiagnosticsIssue = { level, code, message };

    if (element) {
        issue.element = element;
    }

    return issue;
}

function getReferencedText(element: HTMLElement, attribute: string): string {
    const value = element.getAttribute(attribute);

    if (!value) {
        return "";
    }

    return value
        .split(/\s+/)
        .map((id) => element.ownerDocument.getElementById(id)?.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ")
        .trim();
}

function getControlLabelText(element: HTMLElement): string {
    if (!("labels" in element)) {
        return "";
    }

    const labels = (element as HTMLInputElement).labels;

    if (!labels) {
        return "";
    }

    return Array.from(labels)
        .map((label) => label.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ")
        .trim();
}

function hasAccessibleName(element: HTMLElement): boolean {
    return Boolean(
        element.getAttribute("aria-label")?.trim()
        || getReferencedText(element, "aria-labelledby")
        || getControlLabelText(element)
        || element.textContent?.trim()
        || element.getAttribute("title")?.trim()
    );
}

function isHiddenFromDiagnostics(element: HTMLElement): boolean {
    return Boolean(
        element.hidden
        || element.closest("[hidden]")
        || element.closest("[aria-hidden='true']")
    );
}

function getComponentWarningMessage(code: string): string {
    if (code === "missing-accessible-name") {
        return "Accessible First applied a fallback accessible name. Provide a meaningful aria-label or aria-labelledby.";
    }

    return `Accessible First component warning: ${code}`;
}

function getStatus(errorCount: number, warningCount: number): PageDiagnosticsStatus {
    if (errorCount > 0) {
        return "blocked";
    }

    if (warningCount > 0) {
        return "needs-attention";
    }

    return "healthy";
}

/**
 * Logs a PageDiagnosticsReport to the browser console.
 */
export function logPageDiagnostics(report: PageDiagnosticsReport): void {
    console.groupCollapsed("Accessible First Page Report");
    console.log(`Status: ${report.status}`);
    console.log(`Errors: ${report.errorCount}`);
    console.log(`Warnings: ${report.warningCount}`);

    for (const issue of report.issues) {
        const line = `[${issue.level}] ${issue.code}: ${issue.message}`;

        if (issue.level === "error") {
            console.error(line, issue.element ?? "");
        } else if (issue.level === "warning") {
            console.warn(line, issue.element ?? "");
        } else {
            console.info(line, issue.element ?? "");
        }
    }

    console.groupEnd();
}

/**
 * Inspects a composed page for common semantic and accessibility issues.
 */
export function inspectPage(
    root: HTMLElement,
    options: PageDiagnosticsOptions = {}
): PageDiagnosticsReport {
    const issues: PageDiagnosticsIssue[] = [];

    const headers = root.querySelectorAll("header");
    const mains = root.querySelectorAll("main");
    const navs = root.querySelectorAll("nav");
    const footers = root.querySelectorAll("footer");
    const h1s = root.querySelectorAll("h1");

    if (headers.length === 0) {
        issues.push(createIssue("warning", "page.header.missing", "Page has no header landmark."));
    }

    if (mains.length === 0) {
        issues.push(createIssue("error", "page.main.missing", "Page has no main landmark."));
    }

    if (mains.length > 1) {
        issues.push(createIssue("error", "page.main.multiple", "Page has more than one main landmark."));
    }

    if (navs.length === 0) {
        issues.push(createIssue("warning", "page.navigation.missing", "Page has no navigation landmark."));
    }

    if (footers.length === 0) {
        issues.push(createIssue("info", "page.footer.missing", "Page has no footer landmark."));
    }

    if (h1s.length === 0) {
        issues.push(createIssue("warning", "page.h1.missing", "Page has no h1."));
    }

    if (h1s.length > 1) {
        issues.push(createIssue("warning", "page.h1.multiple", "Page has more than one h1."));
    }

    navs.forEach((nav) => {
        if (!hasAccessibleName(nav as HTMLElement)) {
            issues.push(createIssue(
                "warning",
                "navigation.name.missing",
                "Navigation landmark has no accessible name.",
                nav as HTMLElement
            ));
        }
    });

    root.querySelectorAll<HTMLElement>("section").forEach((section) => {
        if (!section.querySelector("h1, h2, h3, h4, h5, h6")) {
            issues.push(createIssue(
                "warning",
                "section.heading.missing",
                "Section has no heading.",
                section
            ));
        }
    });

    const ids = new Map<string, HTMLElement>();

    root.querySelectorAll<HTMLElement>("[id]").forEach((element) => {
        if (ids.has(element.id)) {
            issues.push(createIssue(
                "error",
                "id.duplicate",
                `Duplicate id found: ${element.id}`,
                element
            ));
            return;
        }

        ids.set(element.id, element);
    });

    root
        .querySelectorAll<HTMLElement>("[aria-controls], [aria-labelledby], [aria-describedby]")
        .forEach((element) => {
            for (const attribute of ["aria-controls", "aria-labelledby", "aria-describedby"]) {
                const value = element.getAttribute(attribute);

                if (!value) {
                    continue;
                }

                for (const id of value.split(/\s+/).filter(Boolean)) {
                    if (!element.ownerDocument.getElementById(id)) {
                        issues.push(createIssue(
                            "error",
                            "aria.reference.broken",
                            `${attribute} references missing id: ${id}`,
                            element
                        ));
                    }
                }
            }
        });

    root
        .querySelectorAll<HTMLElement>("button, [role='button'], a[href], [role='link'], input, select, textarea")
        .forEach((element) => {
            if (isHiddenFromDiagnostics(element)) {
                return;
            }

            if (!hasAccessibleName(element)) {
                issues.push(createIssue(
                    "error",
                    "control.name.missing",
                    "Interactive control has no accessible name.",
                    element
                ));
            }
        });
    
    root.querySelectorAll<HTMLElement>("[data-af-warning]").forEach((element) => {
        if (isHiddenFromDiagnostics(element)) {
            return;
        }

        const warning = element.getAttribute("data-af-warning")?.trim();

        if (!warning) {
            return;
        }

        issues.push(createIssue(
            "warning",
            `component.${warning}`,
            getComponentWarningMessage(warning),
            element
        ));
    });
    
    const errorCount = issues.filter((issue) => issue.level === "error").length;
    const warningCount = issues.filter((issue) => issue.level === "warning").length;

    const report: PageDiagnosticsReport = {
        status: getStatus(errorCount, warningCount),
        issues,
        errorCount,
        warningCount
    };

    if (options.log ?? true) {
        logPageDiagnostics(report);
    }

    return report;
}
