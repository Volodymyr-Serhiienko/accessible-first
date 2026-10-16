import type { ComposedNode, CompositionChild } from "./types";
import { isHTMLElement } from "../../../core/src/dom";

/**
 * Checks whether a value is an Accessible First composed node.
 */
export function isComposedNode(value: unknown): value is ComposedNode {
    return Boolean(
        value
        && typeof value === "object"
        && "element" in value
        && isHTMLElement((value as ComposedNode).element)
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

    const ownerWindow = (child as Node).ownerDocument?.defaultView;
    if ((ownerWindow && child instanceof ownerWindow.Node)
        || (typeof Node !== "undefined" && child instanceof Node)) {
        return child;
    }
    if (ownerWindow && (child as Node).nodeType) {
        try {
            ownerWindow.Node.prototype.hasChildNodes.call(child);
            return child as Node;
        } catch { /* Not a DOM node. Continue with composed-child detection. */ }
    }

    if (child && typeof child === "object" && "element" in child) {
        const element = child.element;
        return isHTMLElement(element) ? element : null;
    }

    return null;
}

/**
 * Returns a composed child's cleanup without materializing its element again.
 * Explicit controller-shaped children can release resources after render failure.
 */
export function getDestroyer(child: CompositionChild): (() => void) | null {
    if (!child || typeof child !== "object" || !("element" in child) || typeof child.destroy !== "function") {
        return null;
    }
    const destroy = child.destroy;
    return () => destroy.call(child);
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
