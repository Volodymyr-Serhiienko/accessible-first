import type { ComposedNode, CompositionChild } from "./types";

/**
 * Checks whether a value is an Accessible First composed node.
 */
export function isComposedNode(value: unknown): value is ComposedNode {
    return Boolean(
        value
        && typeof value === "object"
        && "element" in value
        && (value as ComposedNode).element instanceof HTMLElement
    );
}

/**
 * Converts a composition child into a DOM Node.
 * Null, undefined, and false are ignored.
 */
export function toNode(child: CompositionChild): Node | null {
    if (child === null || child === undefined || child === false) {
        return null;
    }

    if (typeof child === "string" || typeof child === "number" || child === true) {
        return document.createTextNode(String(child));
    }

    if (child instanceof Node) {
        return child;
    }

    if (isComposedNode(child)) {
        return child.element;
    }

    return null;
}

/**
 * Returns a cleanup callback for a composed child when it exposes destroy().
 */
export function getDestroyer(child: CompositionChild): (() => void) | null {
    if (!isComposedNode(child) || typeof child.destroy !== "function") {
        return null;
    }

    return () => child.destroy?.();
}

/**
 * Collects destroy callbacks from composed children.
 */
export function collectDestroyers(children: CompositionChild[]): Array<() => void> {
    return children
        .map(getDestroyer)
        .filter((destroyer): destroyer is () => void => Boolean(destroyer));
}

/**
 * Appends composition children to a parent element.
 */
export function append<TElement extends HTMLElement>(
    parent: TElement,
    ...children: CompositionChild[]
): TElement {
    for (const child of children) {
        const node = toNode(child);

        if (node) {
            parent.append(node);
        }
    }

    return parent;
}
