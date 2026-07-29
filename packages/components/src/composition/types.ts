/**
 * A composed DOM node returned by Accessible First composition helpers.
 * If destroy() exists, parent slots and mounts will call it during cleanup.
 */
export interface ComposedNode<TElement extends HTMLElement = HTMLElement> {
    readonly element: TElement;
    destroy?(): void;
}

/**
 * Values that can be appended into a composed DOM tree.
 * Composed nodes are unwrapped to their element, and primitive values become text.
 */
export type CompositionChild =
    | ComposedNode
    | Node
    | string
    | number
    | boolean
    | null
    | undefined;

/**
 * A single composition child or an array of children.
 * Useful for component slots such as trigger, panel, actions, and icon.
 */
export type CompositionContent = CompositionChild | CompositionChild[];

/**
 * Raw HTML attributes accepted by composition helpers.
 * `null`, `undefined`, and `false` remove an attribute; `true` creates a boolean attribute.
 */
export type ElementAttributes = Record<string, string | number | boolean | null | undefined>;

/**
 * Common DOM options shared by composition helpers and composed components.
 */
export interface BaseCompositionOptions {
    id?: string;
    className?: string;
    attributes?: ElementAttributes;
}

/**
 * Options used by createElement() to build a native HTMLElement.
 */
export interface CreateElementOptions {
    id?: string;
    className?: string;
    text?: string;
    attributes?: ElementAttributes;
    children?: CompositionChild[];
}

/**
 * Where a composed tree should be mounted.
 */
export type MountTarget = HTMLElement | string;

/**
 * Mount behavior.
 */
export interface MountOptions {
    replace?: boolean;
}

/**
 * A mounted tree with an explicit unmount operation.
 */
export interface MountedTree {
    readonly target: HTMLElement;
    readonly element: HTMLElement;
    unmount(): void;
}
