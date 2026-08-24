import type { ComposedNode, CompositionChild } from "../composition";
import type {
    DocumentMetadataOptions,
    DocumentMetadataUpdateOptions
} from "../document-metadata";
import type { LocaleTextProvider } from "../localization";

/**
 * Page color scheme mode.
 * "system" follows the user's operating system preference.
 */
export type PageTheme = "system" | "light" | "dark";

/**
 * Localized message keys used by createPage() fallback text.
 */
export type PageMessageKey =
    | "page.skipLinkText"
    | "page.navigationLabel";

/**
 * Localization provider accepted by createPage().
 */
export type PageLocalization = LocaleTextProvider<PageMessageKey>;

/**
 * Severity level for a page diagnostics issue.
 */
export type PageDiagnosticsLevel = "info" | "warning" | "error";

/**
 * Overall page diagnostics result.
 */
export type PageDiagnosticsStatus = "healthy" | "needs-attention" | "blocked";

/**
 * Area checked by page diagnostics.
 */
export type PageDiagnosticsCategory =
    | "document"
    | "landmark"
    | "heading"
    | "section"
    | "control"
    | "aria"
    | "component";

/**
 * Options for createPage().
 */
export interface PageOptions {
    title?: string;
    mainId?: string;
    skipLink?: boolean | string;
    skipLinkTargetId?: string;
    navigationLabel?: string;
    locale?: PageLocalization | null;
    theme?: PageTheme;
    metadata?: DocumentMetadataOptions | false;
}

/**
 * One issue found by page.inspect().
 */
export interface PageDiagnosticsIssue {
    level: PageDiagnosticsLevel;
    code: string;
    message: string;
    element?: HTMLElement;
    category: PageDiagnosticsCategory;
}

/**
 * Full report returned by page.inspect() or inspectPage().
 */
export interface PageDiagnosticsReport {
    status: PageDiagnosticsStatus;
    issues: PageDiagnosticsIssue[];
    errorCount: number;
    warningCount: number;
    infoCount?: number;
}

/**
 * Optional stricter document metadata checks for public pages.
 */
export interface PageDiagnosticsDocumentMetadataOptions {
    requireDescription?: boolean;
    requireCanonical?: boolean;
    requireRobots?: boolean;
    requireManifest?: boolean;
    requireOpenGraph?: boolean;
    requireTwitter?: boolean;
    requireStructuredData?: boolean;
}

/**
 * Options for page diagnostics.
 */
export interface PageDiagnosticsOptions {
    log?: boolean;
    document?: Document;
    categories?: PageDiagnosticsCategory[];
    documentMetadata?: PageDiagnosticsDocumentMetadataOptions;
}

/**
 * Top-level semantic page controller.
 *
 * Page owns a root element, creates a main landmark, and exposes fluent methods
 * for header, navigation, main content, sections, footer, diagnostics, and cleanup.
 */
export interface Page extends ComposedNode {
    readonly main: HTMLElement;
    header(...children: CompositionChild[]): Page;
    navigation(...children: CompositionChild[]): Page;
    section(section: CompositionChild): Page;
    setMainContent(...children: CompositionChild[]): Page;
    focusMain(options?: FocusOptions): Page;
    updateMetadata(options: DocumentMetadataUpdateOptions): Page;
    footer(...children: CompositionChild[]): Page;
    appendToMain(...children: CompositionChild[]): Page;
    inspect(options?: PageDiagnosticsOptions): PageDiagnosticsReport;
    destroy(): void;
    isDestroyed(): boolean;
}
