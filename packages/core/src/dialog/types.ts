import type { AriaReferences } from "../aria";

/**
 * ARIA role for the dialog element.
 */
export type DialogRole = "dialog" | "alertdialog";

/**
 * Element reference used for initial or fallback focus.
 */
export type DialogElement =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Options for createDialog().
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
 * Controller returned by createDialog().
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
