import type { AriaReferences } from "../aria";

/**
 * Defines the semantic accessibility role for the dialog element.
 * - "dialog": A standard modal or non-modal message window.
 * - "alertdialog": A disruptive confirmation window containing critical or urgent actions.
 */
export type DialogRole = "dialog" | "alertdialog";

/**
 * Represents a reference to a target dialog-associated DOM element.
 * Can be a direct `HTMLElement`, a function that evaluates to one, or a nullable value.
 */
export type DialogElement =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Configuration options for managing the behavior and accessibility state of a dialog.
 */
export interface DialogOptions {
    defaultOpen?: boolean;
    modal?: boolean;
    trapFocus?: boolean;
    closeOnEscape?: boolean;
    restoreFocus?: boolean;
    role?: DialogRole;
    labelledBy?: AriaReferences;
    describedBy?: AriaReferences;
    initialFocus?: DialogElement;
    fallbackFocus?: DialogElement;
    onOpenChange?: (open: boolean) => void;
}

/**
 * Interface representing a managed modal or non-modal dialog instance.
 * Coordinates ARIA attributes, focus containment, and event listeners to satisfy accessible overlay guidelines.
 */
export interface Dialog {
    readonly element: HTMLElement;
    open(): void;
    close(): void;
    toggle(): void;
    setOpen(open: boolean): void;
    isOpen(): boolean;
    destroy(): void;
}
