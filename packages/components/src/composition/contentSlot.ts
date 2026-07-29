import { append, collectDestroyers } from "./append";
import type { CompositionChild } from "./types";

/**
 * Managed content area used by composed components.
 * It replaces children and destroys nested composed nodes safely.
 */
export interface ContentSlot {
    set(children: CompositionChild[]): void;
    dispose(): void;
}

/**
 * Creates a managed content slot inside a parent element.
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
