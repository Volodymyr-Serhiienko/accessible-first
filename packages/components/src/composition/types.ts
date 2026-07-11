/**
 * Represents a structured UI component node holding an active DOM reference 
 * along with optional hook routines to tear down runtime state.
 */
export interface ComposedNode {
    readonly element: HTMLElement;
    destroy?(): void;
}

/**
 * Valid dynamic content variants that can be arranged and composed inside DOM node trees.
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
 * Key-value mapping representing the collection of raw attribute properties assigned onto an HTML node.
 */
export type ElementAttributes = Record<string, string | number | boolean | null | undefined>;

/**
 * Configuration options detailing properties and child segments to build an HTMLElement tree structure.
 */
export interface CreateElementOptions {
    id?: string;
    className?: string;
    text?: string;
    attributes?: ElementAttributes;
    children?: CompositionChild[];
}

/**
 * A native HTMLElement container pointer, or a unique string selector query targeting the DOM anchor.
 */
export type MountTarget = HTMLElement | string;

/**
 * Fine-tuning flag parameters defining layout placement behaviors upon initial view attachment.
 */
export interface MountOptions {
    replace?: boolean;
}

/**
 * Interface representing a successfully injected, live-managed DOM tree section.
 */
export interface MountedTree {
    readonly target: HTMLElement;
    readonly element: HTMLElement;
    unmount(): void;
}
