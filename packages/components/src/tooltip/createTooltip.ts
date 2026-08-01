import { restoreAttribute } from "../../../core/src/dom";
import { addEventListener, type Cleanup } from "../../../core/src/events";
import { createAnnouncer, type Announcer } from "../../../core/src/live-region";

export interface TooltipOptions {
    text?: string | null;
    announceOnHover?: boolean;
}

export interface Tooltip {
    setText(text: string | null): void;
    getText(): string | null;
    setAnnounceOnHover(announceOnHover: boolean): void;
    destroy(): void;
}

function getReferencedText(element: HTMLElement, attribute: string): string {
    const value = element.getAttribute(attribute);

    if (!value) return "";

    return value
        .split(/\s+/)
        .map((id) => element.ownerDocument.getElementById(id)?.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ")
        .trim();
}

function normalizeText(text: string | null | undefined): string | null {
    const trimmed = text?.trim();

    return trimmed ? trimmed : null;
}

/**
 * Adds a visual CSS tooltip and optional polite hover announcement to an element.
 */
export function createTooltip(
    element: HTMLElement,
    options: TooltipOptions = {}
): Tooltip {
    const originalTooltip = element.getAttribute("data-af-tooltip");

    let text = normalizeText(options.text);
    let announceOnHover = options.announceOnHover ?? false;
    let announcer: Announcer | null = null;
    let cleanups: Cleanup[] = [];
    let destroyed = false;

    function getAnnouncementText(): string {
        return (
            text
            || element.getAttribute("aria-label")?.trim()
            || getReferencedText(element, "aria-labelledby")
            || element.textContent?.trim()
            || ""
        );
    }

    function getAnnouncer(): Announcer {
        if (!announcer) {
            announcer = createAnnouncer({
                container: element.ownerDocument.body ?? element.ownerDocument.documentElement
            });
        }

        return announcer;
    }

    function disposeListeners(): void {
        for (const cleanup of cleanups.splice(0)) {
            cleanup();
        }
    }

    function syncText(): void {
        if (text) {
            element.setAttribute("data-af-tooltip", text);
            return;
        }

        element.removeAttribute("data-af-tooltip");
    }

    function handlePointerEnter(event: PointerEvent): void {
        if (event.pointerType && event.pointerType !== "mouse") {
            return;
        }

        const message = getAnnouncementText();

        if (message) {
            getAnnouncer().announce(message);
        }
    }

    function syncAnnouncement(): void {
        disposeListeners();

        if (!announceOnHover) {
            announcer?.clear();
            return;
        }

        cleanups.push(
            addEventListener<PointerEvent>(element, "pointerenter", handlePointerEnter),
            addEventListener<PointerEvent>(element, "pointerleave", () => announcer?.clear())
        );
    }

    syncText();
    syncAnnouncement();

    return {
        setText(nextText: string | null): void {
            if (destroyed) return;

            text = normalizeText(nextText);
            syncText();
        },

        getText(): string | null {
            return text;
        },

        setAnnounceOnHover(nextAnnounceOnHover: boolean): void {
            if (destroyed) return;

            announceOnHover = nextAnnounceOnHover;
            syncAnnouncement();
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            disposeListeners();
            announcer?.destroy();
            restoreAttribute(element, "data-af-tooltip", originalTooltip);
        }
    };
}
