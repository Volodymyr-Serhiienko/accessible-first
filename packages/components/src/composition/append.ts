import type { ComposedNode, CompositionChild } from "./types";

/**
 * Assesses whether an untyped runtime value satisfies the structure of a ComposedNode.
 * Evaluates object signatures to verify the existence of a valid native HTMLElement instance.
 *
 * @param value - The unknown structure evaluated against the ComposedNode layout model.
 * @returns True if the target structure is an object housing an HTMLElement reference.
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
 * Normalizes a polymorphic composition child input into a single standard native DOM Node.
 * Reassigns boolean indicators and numeric parameters to primitive text streams, passes through 
 * raw DOM objects, and maps high-level component structures to their managed core HTML layout roots.
 *
 * @param child - The raw variable content, object node, or scalar primitive to process.
 * @returns A native DOM Node containing the structural tree branch, or null if the child is ignorable.
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
 * Extracts and isolates the internal cleanup hook sequence belonging to a composition element wrapper.
 * Creates an safe executor wrapper that isolates outer loops from runtime component structure errors.
 *
 * @param child - The composition structural target queried for a component destruction function.
 * @returns An isolated execution loop callback, or null if no cleanup hooks exist.
 */
export function getDestroyer(child: CompositionChild): (() => void) | null {
    if (!isComposedNode(child) || typeof child.destroy !== "function") {
        return null;
    }

    return () => child.destroy?.();
}

/**
 * Audits a flat collection of rendering children segments to extract valid component teardown functions.
 * Captures clean execution steps for memory lifecycle maps before nodes undergo placement updates.
 *
 * @param children - A dynamic array slice of structural elements containing possible component nodes.
 * @returns A safe collection of teardown execution loops mapped to active sub-components.
 */
export function collectDestroyers(children: CompositionChild[]): Array<() => void> {
    return children
        .map(getDestroyer)
        .filter((destroyer): destroyer is () => void => Boolean(destroyer));
}

/**
 * Integrates, appends, and serializes multiple structural composite nodes into a target parent DOM element.
 * Processes dynamic scalar content inputs and complex structures sequentially onto the inner layout area.
 *
 * @param parent - The targeted core layout element container accumulating the child node segments.
 * @param children - Variadic array of structures, primitives, or layout elements to append.
 * @returns The original parent container element, updated with the active inner child tree.
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
