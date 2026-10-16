import { setAriaAttribute, type AriaAttributeName } from "./setAriaAttribute";
import { splitAriaReferenceIds } from "./setAriaReferences";

interface ReferenceOwners {
    owners: Map<symbol, Set<string>>;
    injected: Set<string>;
}

const ownersByElement = new WeakMap<Element, Map<AriaAttributeName, ReferenceOwners>>();

/** An internal owner of only its contribution to a shared IDREF attribute. */
export interface AriaReferenceOwner {
    set(ids: readonly string[]): void;
    destroy(): void;
}

/** Preserves current external tokens and concurrent owners, including overlapping ids. */
export function createAriaReferenceOwner(element: HTMLElement, name: AriaAttributeName): AriaReferenceOwner {
    let attributes = ownersByElement.get(element);
    if (!attributes) {
        attributes = new Map();
        ownersByElement.set(element, attributes);
    }
    let state = attributes.get(name);
    if (!state) {
        state = { owners: new Map(), injected: new Set() };
        attributes.set(name, state);
    }
    const shared = state;
    const owner = Symbol();
    shared.owners.set(owner, new Set());
    let destroyed = false;

    function sync(): void {
        const current = splitAriaReferenceIds(element.getAttribute(name));
        const external = current.filter(id => !shared.injected.has(id));
        const contributed = new Set(Array.from(shared.owners.values()).flatMap(ids => [...ids]));
        const next = [...new Set([...external, ...contributed])];
        const externalIds = new Set(external);
        shared.injected = new Set([...contributed].filter(id => !externalIds.has(id)));
        if (next.join(" ") !== current.join(" ")) setAriaAttribute(element, name, next.join(" ") || null);
    }

    return {
        set(ids): void {
            if (destroyed) return;
            shared.owners.set(owner, new Set(ids.flatMap(id => splitAriaReferenceIds(id))));
            sync();
        },
        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            shared.owners.delete(owner);
            sync();
            if (shared.owners.size === 0) {
                attributes.delete(name);
                if (attributes.size === 0) ownersByElement.delete(element);
            }
        }
    };
}
