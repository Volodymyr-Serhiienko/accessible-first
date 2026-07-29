import { getDestroyer, toNode } from "./append";
import type { CompositionChild, MountedTree, MountOptions, MountTarget } from "./types";

/**
 * Resolves a mount target from an HTMLElement or a CSS selector.
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
 * Mounts a composition tree into a target element.
 *
 * By default, existing target children are replaced. Pass { replace: false }
 * to append instead.
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

    let unmounted = false;

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
            if (unmounted) {
                return;
            }

            unmounted = true;
            destroy?.();
            node.parentNode?.removeChild(node);
        }
    };
}
