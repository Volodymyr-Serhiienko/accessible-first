import { P } from "./af";

/**
 * Visible status line used by playground examples.
 * It is also a polite live region for screen reader feedback.
 */
export const status = P({
    id: "status",
    className: "status",
    text: "Ready for component checks.",
    attributes: {
        role: "status",
        "aria-live": "polite",
        "aria-atomic": "true"
    }
});

let pendingAnnouncementId: number | null = null;

/**
 * Announces a status message even when the same message is repeated.
 */
export function announce(message: string): void {
    if (pendingAnnouncementId !== null) {
        window.clearTimeout(pendingAnnouncementId);
        pendingAnnouncementId = null;
    }

    status.element.textContent = "";

    if (!message) {
        return;
    }

    pendingAnnouncementId = window.setTimeout(() => {
        status.element.textContent = message;
        pendingAnnouncementId = null;
    }, 0);
}
