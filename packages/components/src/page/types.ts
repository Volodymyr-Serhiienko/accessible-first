import type { ComposedNode, CompositionChild } from "../composition";

/**
 * Page color scheme mode.
 * "system" follows the user's operating system preference.
 */
export type PageTheme = "system" | "light" | "dark";

/**
 * Severity level for a page diagnostics issue.
 */
export type PageDiagnosticsLevel = "info" | "warning" | "error";

/**
 * Overall page diagnostics result.
 */
export type PageDiagnosticsStatus = "healthy" | "needs-attention" | "blocked";

/**
 * Options for createPage().
 */
export interface PageOptions {
    title?: string;
    mainId?: string;
    skipLink?: boolean | string;
    navigationLabel?: string;
    theme?: PageTheme;
}

/**
 * One issue found by page.inspect().
 */
export interface PageDiagnosticsIssue {
    level: PageDiagnosticsLevel;
    code: string;
    message: string;
    element?: HTMLElement;
}

/**
 * Full report returned by page.inspect() or inspectPage().
 */
export interface PageDiagnosticsReport {
    status: PageDiagnosticsStatus;
    issues: PageDiagnosticsIssue[];
    errorCount: number;
    warningCount: number;
}

/**
 * Options for page diagnostics.
 */
export interface PageDiagnosticsOptions {
    log?: boolean;
}

/**
 * Top-level semantic page controller.
 *
 * Page owns a root element, creates a main landmark, and exposes fluent methods
 * for header, navigation, main content, sections, footer, diagnostics, and cleanup.
 */export interface Page extends ComposedNode {
    readonly main: HTMLElement;
    header(...children: CompositionChild[]): Page;
    navigation(...children: CompositionChild[]): Page;
    section(section: CompositionChild): Page;
    setMainContent(...children: CompositionChild[]): Page;
    focusMain(options?: FocusOptions): Page;
    footer(...children: CompositionChild[]): Page;
    appendToMain(...children: CompositionChild[]): Page;
    inspect(options?: PageDiagnosticsOptions): PageDiagnosticsReport;
    destroy(): void;
    isDestroyed(): boolean;
}
