import { createTaskScope, type ScopedTask } from "../../../core/src/task";
import { runCleanups } from "../../../core/src/events";
import { createPendingState, type PendingStateOptions } from "../foundation";
import { toCompositionChildren } from "./content";
import { createContentSlot } from "./contentSlot";
import { Stack } from "./primitives";
import { getCompositionElementOptions } from "./options";
import type { BaseCompositionOptions, ComposedNode, CompositionContent } from "./types";

/** Creates owned content only after its asynchronous prerequisites are ready. */
export type LazyContentFactory = () => CompositionContent;

/** Localized content and asynchronous loading policy for LazyContent. */
export interface LazyContentOptions extends BaseCompositionOptions {
    /** Loads code/data, returning a synchronous factory rather than an already-created view. */
    load(signal: AbortSignal): Promise<LazyContentFactory>;
    /** Creates the localized pending view for each attempt. */
    pendingContent(): CompositionContent;
    /** Creates failure feedback and optional retry controls; must not throw. */
    failureContent(error: unknown, retry: () => void): CompositionContent;
    /** Shared focus-preserving pending feedback; initial loading is silent. */
    pendingOptions?: Omit<PendingStateOptions, "pending">;
}

/** An owned asynchronous content slot; late results never instantiate obsolete views. */
export interface ComposedLazyContent extends ComposedNode {
    /** Cancels the previous attempt and begins a fresh one. */
    reload(): void;
    /** Cancels loading and destroys all owned content. */
    destroy(): void;
    /** Reports whether the slot has been permanently disposed. */
    isDestroyed(): boolean;
}

/** Loads code/data without changing the synchronous composition or router contracts. */
export function LazyContent(options: LazyContentOptions): ComposedLazyContent {
    const root = Stack(getCompositionElementOptions(options, { "data-af-composition": "lazy-content" }));
    if (!root.element.hasAttribute("tabindex")) root.element.tabIndex = -1;
    const slot = createContentSlot(root.element);
    const tasks = createTaskScope();
    const pending = createPendingState(root.element, { ...options.pendingOptions, pending: true });
    let disposed = false;
    let rendering = false;
    let queued = false;

    function render(task: ScopedTask, factory: LazyContentFactory): void {
        rendering = true;
        try {
            const content = Stack(...toCompositionChildren(factory()));
            try {
                if (task.isCurrent()) slot.set([content]);
                else content.destroy?.();
            } catch (error) {
                try { content.destroy?.(); }
                finally { content.element.remove(); }
                throw error;
            }
        } finally {
            rendering = false;
            // A factory/child cleanup may navigate or reload while the slot is being replaced.
            if (!task.isCurrent()) {
                try { slot.dispose(); }
                finally { root.element.replaceChildren(); }
            }
        }
    }

    async function complete(task: ScopedTask): Promise<void> {
        try {
            const factory = await options.load(task.signal);
            if (!task.isCurrent()) return;
            render(task, factory);
            if (task.isCurrent()) root.element.setAttribute("data-af-lazy-state", "ready");
        } catch (error) {
            if (!task.isCurrent()) return;
            render(task, () => options.failureContent(error, reload));
            if (task.isCurrent()) root.element.setAttribute("data-af-lazy-state", "error");
        } finally {
            if (task.isCurrent()) pending.setPending(false);
        }
    }

    function reload(): void {
        if (disposed) return;
        if (rendering) {
            tasks.cancel();
            if (!queued) {
                queued = true;
                queueMicrotask(() => { queued = false; reload(); });
            }
            return;
        }
        const task = tasks.begin();
        const restoreFocus = root.element.contains(root.element.ownerDocument.activeElement);
        pending.setPending(true);
        root.element.setAttribute("data-af-lazy-state", "pending");
        render(task, options.pendingContent);
        if (!task.isCurrent()) return;
        if (restoreFocus && root.element.isConnected && !root.element.contains(root.element.ownerDocument.activeElement))
            root.element.focus({ preventScroll: true });
        void complete(task);
    }

    reload();
    return {
        element: root.element,
        reload,
        isDestroyed: () => disposed,
        destroy(): void {
            if (disposed) return;
            disposed = true;
            try { runCleanups([() => tasks.destroy(), () => pending.destroy(), () => slot.dispose(), () => root.destroy?.()]); }
            finally { root.element.remove(); }
        }
    };
}
