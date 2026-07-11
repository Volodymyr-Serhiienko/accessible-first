import { getDestroyer, toNode } from "./append";
import type { CompositionChild, MountedTree, MountOptions, MountTarget } from "./types";

/**
 * Resolves a polymorphic target pointer into a valid native HTML container element.
 * Processes direct node object references immediately or evaluates query selector strings, 
 * throwing an operational error if no corresponding DOM node matches.
 *
 * @param target - A native HTMLElement target, or a string query selector targeting the anchor.
 * @returns The resolved native HTMLElement matching the selection framework.
 * @throws An Error if a string query selector fails to discover a live DOM element.
 */
export function resolveMountTarget(target: MountTarget): HTMLElement {
    if (typeof target !== "string") {
        return target;
    }

    const element = document.querySelector<HTMLElement>(target);

    if (!element) {
        throw new Error(`Mount target not found: ${target}`);
    }

    return element;
}

/**
 * Injects a structural composition tree or individual element node into a targeted layout anchor.
 * Extracts underlying component structures, determines positioning strategies based on layout flags 
 * (replacing children or appending nodes), binds destruction sequences, and returns a controlled 
 * layout tree token exposing clean lifecycle detachment routines.
 *
 * @param tree - The raw structural child node, textual element, or composite component tree to attach.
 * @param target - The native HTMLElement reference or string query selector identifying the mount destination.
 * @param options - Configuration behavior adjusting structural replacement algorithms.
 * @returns A MountedTree instance exposing isolated layout tracking attributes and unmount methods.
 * @throws An Error if the provided composition parameter yields an empty or non-renderable node.
 */
export function mount(
    tree: CompositionChild,
    target: MountTarget,
    options: MountOptions = {}
): MountedTree {
    const targetElement = resolveMountTarget(target);
    const node = toNode(tree);

    if (!node) {
        throw new Error("Cannot mount an empty composition tree.");
    }

    const replace = options.replace ?? true;
    const destroy = getDestroyer(tree);

    if (replace) {
        targetElement.replaceChildren(node);
    } else {
        targetElement.append(node);
    }

    const element = node instanceof HTMLElement ? node : targetElement;

    return {
        target: targetElement,
        element,

        unmount(): void {
            destroy?.();
            node.parentNode?.removeChild(node);
        }
    };
}
