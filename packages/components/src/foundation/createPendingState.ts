import { restoreAttribute } from "../../../core/src/dom";
import { createActionAnnouncer, type ActionAnnouncer } from "./createActionAnnouncer";

/** Localized waiting message; false disables speech for background/shared work. */
export type PendingMessage = string | (() => string) | false;

/** Options for a focus-preserving pending state. Initial pending state is silent. */
export interface PendingStateOptions {
    pending?: boolean;
    pendingMessage?: PendingMessage;
    /** Waiting announcement delay in milliseconds. Defaults to 500. */
    pendingDelay?: number;
}

/** Shared asynchronous action state; does not disable or rename its element. */
export interface PendingState {
    setPending(pending: boolean): void;
    isPending(): boolean;
    /** Cancels activation while pending. Keep an application-level request guard too. */
    guard(event: Event): boolean;
    update(options: PendingStateOptions): void;
    destroy(): void;
}

/**
 * Marks an action busy, guards repeated activation and announces long waits once.
 * Its document-level announcement remains outside the aria-busy subtree.
 */
export function createPendingState(element: HTMLElement, options: PendingStateOptions = {}): PendingState {
    const originalBusy = element.getAttribute("aria-busy");
    const originalPending = element.getAttribute("data-af-pending");
    const owner = element.ownerDocument.defaultView ?? window;
    let pending = options.pending ?? false;
    let message = options.pendingMessage ?? false;
    let delay = options.pendingDelay ?? 500;
    let timer: number | null = null;
    let announced = false;
    let destroyed = false;
    let announcer: ActionAnnouncer | null = null;

    function clear(): void {
        if (timer !== null) owner.clearTimeout(timer);
        timer = null;
        announcer?.clear();
    }

    function sync(): void {
        if (pending) {
            element.setAttribute("aria-busy", "true");
            element.setAttribute("data-af-pending", "true");
        } else {
            element.removeAttribute("aria-busy");
            element.removeAttribute("data-af-pending");
        }
    }

    function schedule(): void {
        if (!message || announced || timer !== null) return;
        const wait = Number.isFinite(delay) ? Math.max(0, delay) : 500;
        timer = owner.setTimeout(() => {
            timer = null;
            if (destroyed || !pending || !message) return;
            const text = typeof message === "function" ? message() : message;
            if (!text.trim()) return;
            announced = true;
            announcer ??= createActionAnnouncer({ container: element.ownerDocument.body });
            announcer.announce(text);
        }, wait);
    }

    function setPending(next: boolean): void {
        if (destroyed || pending === next) return;
        pending = next;
        clear();
        announced = false;
        sync();
        if (pending) schedule();
    }

    sync();
    return {
        setPending,
        isPending: () => pending,
        guard(event): boolean {
            if (destroyed || !pending) return false;
            event.preventDefault();
            event.stopImmediatePropagation();
            schedule();
            return true;
        },
        update(next): void {
            if (destroyed) return;
            if (next.pendingMessage !== undefined) {
                message = next.pendingMessage;
                if (message === false) clear();
            }
            if (next.pendingDelay !== undefined) delay = next.pendingDelay;
            if (next.pending !== undefined) setPending(next.pending);
        },
        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            clear();
            announcer?.destroy();
            restoreAttribute(element, "aria-busy", originalBusy);
            restoreAttribute(element, "data-af-pending", originalPending);
        }
    };
}
