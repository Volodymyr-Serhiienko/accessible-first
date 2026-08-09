import { getOwnerDocument, getOwnerWindow } from "../dom";
import { createId } from "../id";
import type { LiveRegion, LiveRegionOptions, LiveRegionPoliteness } from "./types";

const ANNOUNCEMENT_DELAY = 50;

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

function createRegion(
    ownerDocument: Document,
    politeness: LiveRegionPoliteness,
    atomic: boolean
): HTMLElement {
    const region = ownerDocument.createElement("div");

    region.setAttribute("aria-live", politeness);
    region.setAttribute("aria-atomic", String(atomic));
    region.setAttribute("role", politeness === "assertive" ? "alert" : "status");

    return region;
}

/**
 * Creates a visually hidden ARIA live region.
 *
 * Announcements are written asynchronously and alternate between two internal
 * regions so repeated identical messages are detected more reliably.
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
    const regions = [
        createRegion(ownerDocument, politeness, atomic),
        createRegion(ownerDocument, politeness, atomic)
    ];

    let pendingAnnouncementId: number | null = null;
    let activeRegionIndex = 0;
    let destroyed = false;

    element.id = createId("af-live-region");
    element.setAttribute("data-af-live-region", "");

    visuallyHide(element);
    element.append(...regions);
    container.appendChild(element);

    function cancelPendingAnnouncement(): void {
        if (pendingAnnouncementId === null) {
            return;
        }

        ownerWindow.clearTimeout(pendingAnnouncementId);
        pendingAnnouncementId = null;
    }

    function clearRegionText(): void {
        for (const region of regions) {
            region.textContent = "";
        }
    }

    function clear(): void {
        cancelPendingAnnouncement();
        clearRegionText();
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

            activeRegionIndex = (activeRegionIndex + 1) % regions.length;

            const region = regions[activeRegionIndex];

            pendingAnnouncementId = ownerWindow.setTimeout(() => {
                if (destroyed) {
                    return;
                }

                region!.textContent = message;
                pendingAnnouncementId = null;
            }, ANNOUNCEMENT_DELAY);
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
