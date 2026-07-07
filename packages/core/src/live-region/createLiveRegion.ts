import { getOwnerDocument, getOwnerWindow } from "../dom";
import { createId } from "../id";
import type { LiveRegion, LiveRegionOptions } from "./types";

function visuallyHide(element: HTMLElement): void {
    element.style.position = "absolute";
    element.style.width = "1px";
    element.style.height = "1px";
    element.style.margin = "-1px";
    element.style.padding = "0";
    element.style.border = "0";
    element.style.overflow = "hidden";
    element.style.clip = "rect(0 0 0 0)";
    element.style.clipPath = "inset(50%)";
    element.style.whiteSpace = "nowrap";
}

/**
 * Creates and initializes a DOM element configured as an ARIA live region 
 * to handle screen reader text announcements.
 * * Automatically applies structural accessibility settings, updates content asynchronously 
 * to guarantee screen reader interception, and ensures proper cleanup on destruction.
 *
 * @param options - Configuration options for positioning, politeness level, and HTML structure. Defaults to an empty object.
 * @returns A LiveRegion object providing methods to manage announcements and element lifecycle.
 */
export function createLiveRegion(
    options: LiveRegionOptions = {}
): LiveRegion {
    const ownerDocument = options.container
        ? getOwnerDocument(options.container)
        : document;

    const container =
        options.container ??
        ownerDocument.body ??
        ownerDocument.documentElement;

    const politeness = options.politeness ?? "polite";
    const atomic = options.atomic ?? true;

    const element = ownerDocument.createElement("div");
    const ownerWindow = getOwnerWindow(element);

    let pendingAnnouncementId: number | null = null;
    let destroyed = false;

    element.id = createId("af-live-region");
    element.setAttribute("aria-live", politeness);
    element.setAttribute("aria-atomic", String(atomic));
    element.setAttribute("role", politeness === "assertive" ? "alert" : "status");

    visuallyHide(element);
    container.appendChild(element);

    function cancelPendingAnnouncement(): void {
        if (pendingAnnouncementId === null) {
            return;
        }

        ownerWindow.clearTimeout(pendingAnnouncementId);
        pendingAnnouncementId = null;
    }

    function clear(): void {
        cancelPendingAnnouncement();
        element.textContent = "";
    }

    return {
        element,

        announce(message: string): void {
            if (destroyed) {
                return;
            }

            clear();

            if (!message) {
                return;
            }

            pendingAnnouncementId = ownerWindow.setTimeout(() => {
                element.textContent = message;
                pendingAnnouncementId = null;
            }, 0);
        },

        clear,

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;
            clear();
            element.remove();
        }
    };
}
