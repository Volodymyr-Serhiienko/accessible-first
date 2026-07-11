import { append, collectDestroyers } from "./append";
import type { CompositionChild } from "./types";

/**
 * Represents a dynamic rendering container sector capable of safely swap-updating nested views
 * layout branches while tracking and cleaning up stale inner component lifecycle bindings.
 */
export interface ContentSlot {
    set(children: CompositionChild[]): void;
    dispose(): void;
}

/**
 * Creates and initializes a managed content mounting slot bound to a parent layout anchor.
 * Manages rapid tree structural swaps inside the parent node container by tracking sub-component 
 * lifecycles, ensuring memory maps clear out cleanly during replacement cycles or final view teardowns.
 *
 * @param parent - The target native HTMLElement container capturing the dynamic sub-tree segments.
 * @param initialChildren - An array slice of initial layout components, text elements, or child nodes.
 * @returns A ContentSlot interface revealing clean state update and lifecycle isolation methods.
 */
export function createContentSlot(
    parent: HTMLElement,
    initialChildren: CompositionChild[] = []
): ContentSlot {
    let destroyers: Array<() => void> = [];

    function dispose(): void {
        for (const destroy of [...destroyers].reverse()) {
            destroy();
        }

        destroyers = [];
    }

    function set(children: CompositionChild[]): void {
        dispose();
        parent.replaceChildren();
        destroyers = collectDestroyers(children);
        append(parent, ...children);
    }

    if (initialChildren.length > 0) {
        destroyers = collectDestroyers(initialChildren);
        append(parent, ...initialChildren);
    }

    return {
        set,
        dispose
    };
}
