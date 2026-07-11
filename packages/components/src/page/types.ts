import type { ComposedNode, CompositionChild } from "../composition";

/**
 * Severity grading systems defining operational or semantic concerns identified in layout structures.
 */
export type PageDiagnosticsLevel = "info" | "warning" | "error";

/**
 * Summary layout health classifications indicating accessibility metrics or validation outcomes.
 */
export type PageDiagnosticsStatus = "healthy" | "needs-attention" | "blocked";

/**
 * Structural configurations used to initialize semantic layouts and document parameters.
 */
export interface PageOptions {
    title?: string;
    mainId?: string;
    skipLink?: boolean | string;
    navigationLabel?: string;
}

/**
 * Descriptive entry mapping an layout structural mistake, parsing breakdown, or accessibility problem.
 */
export interface PageDiagnosticsIssue {
    level: PageDiagnosticsLevel;
    code: string;
    message: string;
    element?: HTMLElement;
}

/**
 * Comprehensive health validation breakdown scoring semantic compliance across active view trees.
 */
export interface PageDiagnosticsReport {
    status: PageDiagnosticsStatus;
    issues: PageDiagnosticsIssue[];
    errorCount: number;
    warningCount: number;
}

/**
 * Execution modifiers targeting diagnostic scanning routines.
 */
export interface PageDiagnosticsOptions {
    log?: boolean;
}

/**
 * Interface representing a managed top-level semantic document tree container.
 * Enforces fundamental accessibility guidelines (`aria-*`, structural landmarks) while offering 
 * fluent chaining operations to populate distinct core layout sectors.
 */
export interface Page extends ComposedNode {
    readonly main: HTMLElement;
    header(...children: CompositionChild[]): Page;
    navigation(...children: CompositionChild[]): Page;
    section(...children: CompositionChild[]): Page;
    footer(...children: CompositionChild[]): Page;
    appendToMain(...children: CompositionChild[]): Page;
    inspect(options?: PageDiagnosticsOptions): PageDiagnosticsReport;
    destroy(): void;
    isDestroyed(): boolean;
}
