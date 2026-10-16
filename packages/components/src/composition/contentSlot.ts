import { getDestroyer, toNode } from "./append";
import { runCleanups } from "../../../core/src/events";
import type { CompositionChild } from "./types";

/**
 * Managed content area used by composed components.
 * It replaces children and destroys nested composed nodes safely.
 */
export interface ContentSlot {
    set(children: CompositionChild[]): void;
    /** Prepares synchronous content within the slot's replacement revision. */
    setFrom(resolve: () => CompositionChild[]): void;
    /** Adds owned content without detaching existing DOM or its focus. */
    append(children: CompositionChild[]): void;
    dispose(): void;
}

/**
 * Creates a managed content slot inside a parent element.
 */
export function createContentSlot(
    parent: HTMLElement,
    initialChildren: CompositionChild[] = []
): ContentSlot {
    let owned = [...initialChildren];
    let revision = 0;
    let rendered = true;
    const retired = new WeakSet<object>();

    function disposeChildren(children: CompositionChild[]): void {
        runCleanups([...new Set(children)].reverse().map(child => () => {
            const destroy = getDestroyer(child);
            if (!destroy || retired.has(child as object)) return;
            retired.add(child as object);
            destroy();
        }));
    }

    function dispose(): void {
        revision += 1;
        rendered = false;
        const previous = owned;
        owned = [];
        disposeChildren(previous);
    }

    function replace(children: CompositionChild[], current: number): void {
        if (current !== revision) {
            disposeChildren(children.filter(child => !owned.includes(child)));
            return;
        }
        if (rendered && owned.length === children.length && owned.every((child, index) => child === children[index])) return;
        const next = [...children];
        const keep = new Set(children);
        const removed = owned.filter(child => !keep.has(child));
        owned = owned.filter(child => keep.has(child));
        rendered = false;
        runCleanups([
            () => disposeChildren(removed),
            () => {
                // Cleanup may navigate, dispose this slot or commit a newer view.
                if (current !== revision) {
                    disposeChildren(next.filter(child => !owned.includes(child)));
                    return;
                }
                let nodes: Node[];
                try { nodes = next.map(toNode).filter((node): node is Node => node !== null); }
                catch (error) {
                    try { disposeChildren(next.filter(child => !owned.includes(child))); } catch { /* Preserve the render failure. */ }
                    throw error;
                }
                if (current !== revision) {
                    disposeChildren(next.filter(child => !owned.includes(child)));
                    return;
                }
                owned = next;
                rendered = true;
                try { parent.replaceChildren(...nodes); }
                catch (error) {
                    if (current === revision) rendered = false;
                    throw error;
                }
            }
        ]);
    }

    function set(children: CompositionChild[]): void {
        replace(children, ++revision);
    }

    function setFrom(resolve: () => CompositionChild[]): void {
        const current = ++revision;
        replace(resolve(), current);
    }

    function append(children: CompositionChild[]): void {
        if (!rendered) { set([...owned, ...children]); return; }
        const current = ++revision;
        let nodes: Node[];
        try { nodes = children.map(toNode).filter((node): node is Node => node !== null); }
        catch (error) {
            try { disposeChildren(children.filter(child => !owned.includes(child))); } catch { /* Preserve the render failure. */ }
            throw error;
        }
        if (current !== revision) {
            disposeChildren(children.filter(child => !owned.includes(child)));
            return;
        }
        owned = [...owned, ...children];
        try { parent.append(...nodes); }
        catch (error) { if (current === revision) rendered = false; throw error; }
    }

    if (initialChildren.length > 0) {
        try { parent.append(...initialChildren.map(toNode).filter((node): node is Node => node !== null)); }
        catch (error) {
            try { dispose(); } catch { /* Preserve the construction failure. */ }
            throw error;
        }
    }

    return {
        set,
        setFrom,
        append,
        dispose
    };
}
