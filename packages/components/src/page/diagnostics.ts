import { getAriaReferencedText } from "../../../core/src/aria";
import type {
    PageDiagnosticsCategory,
    PageDiagnosticsDocumentMetadataOptions,
    PageDiagnosticsIssue,
    PageDiagnosticsOptions,
    PageDiagnosticsReport,
    PageDiagnosticsStatus
} from "./types";

function createIssue(
    level: PageDiagnosticsIssue["level"],
    category: PageDiagnosticsIssue["category"],
    code: string,
    message: string,
    element?: HTMLElement
): PageDiagnosticsIssue {
    const issue: PageDiagnosticsIssue = { level, category, code, message };

    if (element) {
        issue.element = element;
    }

    return issue;
}

function shouldInspectCategory(
    options: PageDiagnosticsOptions,
    category: PageDiagnosticsCategory
): boolean {
    return options.categories === undefined || options.categories.includes(category);
}

function findDocumentMeta(ownerDocument: Document, name: string): HTMLMetaElement | null {
    return ownerDocument.querySelector<HTMLMetaElement>(`meta[name='${name}']`);
}

function getLinksByRel(ownerDocument: Document, rel: string): HTMLLinkElement[] {
    const expected = rel.toLowerCase();

    return Array.from(ownerDocument.head.querySelectorAll<HTMLLinkElement>("link[rel]"))
        .filter((link) => (link.getAttribute("rel") ?? "")
            .toLowerCase()
            .split(/\s+/)
            .includes(expected));
}

function findDocumentPropertyMeta(ownerDocument: Document, property: string): HTMLMetaElement | null {
    return ownerDocument.querySelector<HTMLMetaElement>(`meta[property='${property}']`);
}

function inspectDocument(
    ownerDocument: Document,
    issues: PageDiagnosticsIssue[],
    options: PageDiagnosticsDocumentMetadataOptions = {}
): void {
    const title = ownerDocument.title.trim();
    const language = ownerDocument.documentElement.getAttribute("lang")?.trim() ?? "";
    const viewport = findDocumentMeta(ownerDocument, "viewport");
    const description = findDocumentMeta(ownerDocument, "description");
    const robots = findDocumentMeta(ownerDocument, "robots");
    const canonicalLinks = getLinksByRel(ownerDocument, "canonical");
    const manifestLinks = getLinksByRel(ownerDocument, "manifest");

    if (!title) {
        issues.push(createIssue("warning", "document", "document.title.missing", "Document has no title."));
    }

    if (!language) {
        issues.push(createIssue("warning", "document", "document.lang.missing", "Document html element has no lang attribute."));
    }

    if (!viewport) {
        issues.push(createIssue("warning", "document", "document.viewport.missing", "Document has no viewport meta tag."));
    } else if (!viewport.content.includes("width=device-width")) {
        issues.push(createIssue("warning", "document", "document.viewport.width", "Viewport meta tag should include width=device-width."));
    }

    if (!description?.content.trim()) {
        issues.push(createIssue(
            options.requireDescription ? "warning" : "info",
            "document",
            "document.description.missing",
            "Document has no meta description. This may be fine for private apps, but public pages usually need one."
        ));
    }

    if (canonicalLinks.length > 1) {
        issues.push(createIssue("warning", "document", "document.canonical.multiple", "Document has more than one canonical link."));
    }

    if (options.requireCanonical && canonicalLinks.length === 0) {
        issues.push(createIssue("warning", "document", "document.canonical.missing", "Public pages should provide a canonical link."));
    } else if (canonicalLinks[0] && !canonicalLinks[0].getAttribute("href")?.trim()) {
        issues.push(createIssue("warning", "document", "document.canonical.href.missing", "Canonical link has no href."));
    }

    if (options.requireRobots && !robots) {
        issues.push(createIssue("warning", "document", "document.robots.missing", "Public pages should define a robots policy."));
    } else if (robots && !robots.content.trim()) {
        issues.push(createIssue("warning", "document", "document.robots.empty", "Robots meta tag has empty content."));
    }

    if (manifestLinks.length > 1) {
        issues.push(createIssue("warning", "document", "document.manifest.multiple", "Document has more than one manifest link."));
    }

    if (options.requireManifest && manifestLinks.length === 0) {
        issues.push(createIssue("warning", "document", "document.manifest.missing", "Installable apps should provide a manifest link."));
    } else if (manifestLinks[0] && !manifestLinks[0].getAttribute("href")?.trim()) {
        issues.push(createIssue("warning", "document", "document.manifest.href.missing", "Manifest link has no href."));
    }

    const hasOpenGraph = Boolean(
        findDocumentPropertyMeta(ownerDocument, "og:title")
        || findDocumentPropertyMeta(ownerDocument, "og:type")
        || findDocumentPropertyMeta(ownerDocument, "og:url")
        || findDocumentPropertyMeta(ownerDocument, "og:image")
    );

    if (options.requireOpenGraph && !hasOpenGraph) {
        issues.push(createIssue("warning", "document", "document.opengraph.missing", "Public pages should provide Open Graph preview metadata."));
    }

    if (hasOpenGraph && !findDocumentPropertyMeta(ownerDocument, "og:image:alt")?.content.trim()) {
        issues.push(createIssue("info", "document", "document.opengraph.image-alt.missing", "Open Graph image should provide og:image:alt."));
    }

    const hasTwitter = Boolean(
        findDocumentMeta(ownerDocument, "twitter:card")
        || findDocumentMeta(ownerDocument, "twitter:title")
        || findDocumentMeta(ownerDocument, "twitter:image")
    );

    if (options.requireTwitter && !hasTwitter) {
        issues.push(createIssue("warning", "document", "document.twitter.missing", "Public pages should provide Twitter/X card metadata."));
    }

    if (hasTwitter && !findDocumentMeta(ownerDocument, "twitter:card")?.content.trim()) {
        issues.push(createIssue("warning", "document", "document.twitter.card.missing", "Twitter/X metadata should provide twitter:card."));
    }
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
        || getAriaReferencedText(element, "aria-labelledby")
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
    console.log(`Info: ${report.infoCount ?? report.issues.filter((issue) => issue.level === "info").length}`);

    for (const issue of report.issues) {
        const line = `[${issue.level}] ${issue.category}/${issue.code}: ${issue.message}`;

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
    const ownerDocument = options.document ?? root.ownerDocument;

    if (shouldInspectCategory(options, "document")) {
        inspectDocument(ownerDocument, issues, options.documentMetadata);
    }

    const headers = root.querySelectorAll("header");
    const mains = root.querySelectorAll("main");
    const navs = root.querySelectorAll("nav");
    const footers = root.querySelectorAll("footer");
    const h1s = root.querySelectorAll("h1");

    if (headers.length === 0) {
        issues.push(createIssue("warning", "landmark", "page.header.missing", "Page has no header landmark."));
    }

    if (mains.length === 0) {
        issues.push(createIssue("error", "landmark", "page.main.missing", "Page has no main landmark."));
    }

    if (mains.length > 1) {
        issues.push(createIssue("error", "landmark", "page.main.multiple", "Page has more than one main landmark."));
    }

    if (navs.length === 0) {
        issues.push(createIssue("warning", "landmark", "page.navigation.missing", "Page has no navigation landmark."));
    }

    if (footers.length === 0) {
        issues.push(createIssue("info", "landmark", "page.footer.missing", "Page has no footer landmark."));
    }

    if (h1s.length === 0) {
        issues.push(createIssue("warning", "heading", "page.h1.missing", "Page has no h1."));
    }

    if (h1s.length > 1) {
        issues.push(createIssue("warning", "heading", "page.h1.multiple", "Page has more than one h1."));
    }

    navs.forEach((nav) => {
        if (!hasAccessibleName(nav as HTMLElement)) {
            issues.push(createIssue(
                "warning",
                "landmark",
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
                "section",
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
                "aria",
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
                            "aria",
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
                    "control",
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
            "component",
            `component.${warning}`,
            getComponentWarningMessage(warning),
            element
        ));
    });
    
    const categories = options.categories;
    const visibleIssues = categories === undefined
        ? issues
        : issues.filter((issue) => categories.includes(issue.category));

    const errorCount = visibleIssues.filter((issue) => issue.level === "error").length;
    const warningCount = visibleIssues.filter((issue) => issue.level === "warning").length;
    const infoCount = visibleIssues.filter((issue) => issue.level === "info").length;

    const report: PageDiagnosticsReport = {
        status: getStatus(errorCount, warningCount),
        issues: visibleIssues,
        errorCount,
        warningCount,
        infoCount
    };

    if (options.log ?? true) {
        logPageDiagnostics(report);
    }

    return report;
}
