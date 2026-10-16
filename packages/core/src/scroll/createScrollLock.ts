import { getOwnerDocument, getOwnerWindow } from "../dom";
import { captureInlineStyles } from "../dom/captureInlineStyles";
import { runCleanups, type Cleanup } from "../events";

/**
 * Controller returned by createScrollLock().
 *
 * It locks and unlocks page scrolling for one document. Multiple active locks
 * are reference-counted internally, so nested overlays can close independently.
 */
export interface ScrollLock {
    activate(): void;
    deactivate(): void;
    isActive(): boolean;
    destroy(): void;
}

interface ScrollLockState {
    count: number;
    scrollX: number;
    scrollY: number;
    restoreStyles: Cleanup;
}

const locks = new WeakMap<Document, ScrollLockState>();

function getNumber(value: string): number {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function lockDocument(ownerDocument: Document): void {
    const current = locks.get(ownerDocument);

    if (current) {
        current.count += 1;
        return;
    }

    const body = ownerDocument.body;
    const documentElement = ownerDocument.documentElement;
    const ownerWindow = getOwnerWindow(documentElement);
    const computedBody = ownerWindow.getComputedStyle(body);
    const scrollbarWidth = Math.max(0, ownerWindow.innerWidth - documentElement.clientWidth);
    const restoreBody = captureInlineStyles(body, ["overflow", "padding-right", "position", "top", "left", "right", "width", "box-sizing"]);
    const restoreRoot = captureInlineStyles(documentElement, ["overflow"]);

    const state: ScrollLockState = {
        count: 1,
        scrollX: ownerWindow.scrollX,
        scrollY: ownerWindow.scrollY,
        restoreStyles: () => runCleanups([restoreBody, restoreRoot])
    };

    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `${-state.scrollY}px`;
    body.style.left = `${-state.scrollX}px`;
    body.style.right = "0";
    body.style.width = "100%";
    body.style.boxSizing = "border-box";

    if (scrollbarWidth > 0) {
        body.style.paddingRight = `${getNumber(computedBody.paddingRight) + scrollbarWidth}px`;
    }

    locks.set(ownerDocument, state);
}

function unlockDocument(ownerDocument: Document): void {
    const state = locks.get(ownerDocument);

    if (!state) return;

    state.count -= 1;

    if (state.count > 0) return;

    const documentElement = ownerDocument.documentElement;
    const ownerWindow = getOwnerWindow(documentElement);

    locks.delete(ownerDocument);
    state.restoreStyles();
    ownerWindow.scrollTo(state.scrollX, state.scrollY);
}

/**
 * Locks page scrolling for the document that owns an element.
 *
 * Multiple locks on the same document are reference-counted, so nested overlays
 * cannot unlock the page until every lock is released.
 */
export function createScrollLock(element: HTMLElement): ScrollLock {
    const ownerDocument = getOwnerDocument(element);
    let active = false;
    let destroyed = false;

    function deactivate(): void {
        if (!active) return;
        active = false;
        unlockDocument(ownerDocument);
    }

    return {
        activate(): void {
            if (active || destroyed) return;

            active = true;
            lockDocument(ownerDocument);
        },

        deactivate,

        isActive(): boolean {
            return active;
        },

        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            deactivate();
        }
    };
}
