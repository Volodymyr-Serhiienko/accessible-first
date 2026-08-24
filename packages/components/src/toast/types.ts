import type { Component } from "../foundation";
import type { LocaleTextProvider } from "../localization";

/**
 * Visual tone of a toast notification.
 */
export type ToastVariant = "info" | "success" | "warning" | "danger";

/**
 * Screen reader announcement priority for a toast.
 */
export type ToastPoliteness = "polite" | "assertive";

/**
 * Fixed viewport placement for toast notifications.
 */
export type ToastPlacement = "top-start" | "top-end" | "bottom-start" | "bottom-end";

/**
 * Localized message keys used by ToastViewport fallback text.
 */
export type ToastMessageKey =
    | "toast.label"
    | "toast.closeLabel"
    | "toast.closeButtonText"
    | "toast.fallbackDescription";

/**
 * Localization provider accepted by ToastViewport.
 */
export type ToastLocalization = LocaleTextProvider<ToastMessageKey>;

/**
 * Reason passed to toast close callbacks.
 */
export type ToastCloseReason = "dismiss" | "action" | "timeout" | "programmatic" | "limit" | "destroy";

/**
 * Called when a toast action button is activated.
 */
export type ToastActionHandler = (event: Event, toast: Toast) => void;

/**
 * Called after a toast closes.
 */
export type ToastCloseHandler = (reason: ToastCloseReason, toast: Toast) => void;

/**
 * Options for a single toast notification.
 */
export interface ToastShowOptions {
    id?: string;
    title?: string;
    description?: string;
    variant?: ToastVariant;
    politeness?: ToastPoliteness;
    duration?: number | null;
    dismissible?: boolean;
    closeLabel?: string;
    actionText?: string;
    actionLabel?: string;
    onAction?: ToastActionHandler | null;
    onClose?: ToastCloseHandler | null;
}

/**
 * Input accepted by ToastViewport.show().
 */
export type ToastInput = string | ToastShowOptions;

/**
 * Options accepted by toast.update().
 */
export interface ToastUpdateOptions extends Partial<Omit<ToastShowOptions, "id" | "onClose">> {}

/**
 * Controller for one visible toast notification.
 */
export interface Toast {
    readonly id: string;
    readonly element: HTMLElement;
    close(reason?: ToastCloseReason): void;
    update(options: ToastUpdateOptions): void;
    resetDuration(duration?: number | null): void;
    isClosed(): boolean;
}

/**
 * Options for createToastViewport().
 */
export interface ToastViewportOptions {
    placement?: ToastPlacement;
    label?: string;
    limit?: number | null;
    duration?: number | null;
    dismissible?: boolean;
    closeLabel?: string;
    locale?: ToastLocalization | null;
    pauseOnHover?: boolean;
    newestOnTop?: boolean;
}

/**
 * Toast viewport controller.
 */
export interface ToastViewport extends Component<HTMLElement> {
    readonly viewport: HTMLElement;
    show(toast: ToastInput): Toast;
    closeAll(reason?: ToastCloseReason): void;
    getToasts(): Toast[];
    update(options: ToastViewportOptions): void;
}
