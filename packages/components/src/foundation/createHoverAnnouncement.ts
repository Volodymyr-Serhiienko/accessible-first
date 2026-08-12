import { getAriaReferencedText } from "../../../core/src/aria";
import { addEventListener, type Cleanup } from "../../../core/src/events";
import { createAnnouncer, type Announcer } from "../../../core/src/live-region";

/**
 * Message source used by createHoverAnnouncement().
 */
export type HoverAnnouncementMessage =
    | string
    | null
    | undefined
    | (() => string | null | undefined);

/**
 * Options for createHoverAnnouncement().
 */
export interface HoverAnnouncementOptions {
    message?: HoverAnnouncementMessage;
    enabled?: boolean;
}

/**
 * Controller for polite mouse-hover announcements.
 */
export interface HoverAnnouncement {
    setMessage(message: HoverAnnouncementMessage): void;
    setEnabled(enabled: boolean): void;
    destroy(): void;
}

function normalizeMessage(message: string | null | undefined): string | null {
    const trimmed = message?.trim();

    return trimmed ? trimmed : null;
}

function getElementAnnouncementText(element: HTMLElement): string | null {
    return normalizeMessage(
        element.getAttribute("aria-label")
        || getAriaReferencedText(element, "aria-labelledby")
        || element.textContent
    );
}

function resolveMessage(
    element: HTMLElement,
    message: HoverAnnouncementMessage
): string | null {
    if (message === undefined) {
        return getElementAnnouncementText(element);
    }

    return normalizeMessage(typeof message === "function" ? message() : message);
}

/**
 * Announces an element label when a mouse pointer enters the element.
 *
 * It does not add a visible tooltip. Use it for controls that are already
 * visually labelled but need more reliable screen reader feedback on hover.
 */
export function createHoverAnnouncement(
    element: HTMLElement,
    options: HoverAnnouncementOptions = {}
): HoverAnnouncement {
    let message = options.message;
    let enabled = options.enabled ?? true;
    let announcer: Announcer | null = null;
    let cleanups: Cleanup[] = [];
    let destroyed = false;

    function getAnnouncer(): Announcer {
        announcer ??= createAnnouncer({
            container: element.ownerDocument.body ?? element.ownerDocument.documentElement
        });

        return announcer;
    }

    function disposeListeners(): void {
        for (const cleanup of cleanups.splice(0)) {
            cleanup();
        }
    }

    function handlePointerEnter(event: PointerEvent): void {
        if (event.pointerType && event.pointerType !== "mouse") return;

        const nextMessage = resolveMessage(element, message);

        if (nextMessage) {
            getAnnouncer().announce(nextMessage);
        }
    }

    function sync(): void {
        disposeListeners();

        if (!enabled) {
            announcer?.clear();
            return;
        }

        cleanups.push(
            addEventListener<PointerEvent>(element, "pointerenter", handlePointerEnter),
            addEventListener<PointerEvent>(element, "pointerleave", () => announcer?.clear())
        );
    }

    sync();

    return {
        setMessage(nextMessage): void {
            if (destroyed) return;

            message = nextMessage;
        },

        setEnabled(nextEnabled): void {
            if (destroyed) return;

            enabled = nextEnabled;
            sync();
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            disposeListeners();
            announcer?.destroy();
        }
    };
}
