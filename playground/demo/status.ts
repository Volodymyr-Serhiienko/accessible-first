import {
    ToastViewport,
    type ToastPoliteness,
    type ToastShowOptions,
    type ToastVariant
} from "./af";
import { playgroundLocale, t } from "./localization";

/**
 * Options for playground announcements shown through the shared toast viewport.
 */
export interface PlaygroundAnnouncementOptions {
    title?: string;
    variant?: ToastVariant;
    politeness?: ToastPoliteness;
    duration?: number | null;
    dismissible?: boolean;
}

/**
 * Shared playground notification viewport.
 */
export const notifications = ToastViewport({
    id: "playground-notifications",
    placement: "bottom-end",
    label: t("app.notifications.label"),
    limit: 4,
    pauseOnHover: true,
    newestOnTop: true,
    locale: playgroundLocale
});

/**
 * Shows a playground notification without forcing focus to move.
 */
export function announce(
    message: string,
    options: PlaygroundAnnouncementOptions = {}
): void {
    const text = message.trim();

    if (!text) return;

    const toastOptions: ToastShowOptions = {
        description: text,
        variant: options.variant ?? "info",
        dismissible: options.dismissible ?? true
    };

    if (options.title !== undefined) toastOptions.title = options.title;
    if (options.politeness !== undefined) toastOptions.politeness = options.politeness;

    if ("duration" in options) {
        toastOptions.duration = options.duration ?? null;
    } else {
        toastOptions.duration = 5000;
    }

    notifications.show(toastOptions);
}
