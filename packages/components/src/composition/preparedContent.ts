import { runCleanups } from "../../../core/src/events";
import { getDestroyer } from "./append";
import { toCompositionChildren } from "./content";
import type { CompositionChild, CompositionContent } from "./types";

/** Internal handoff ledger; native slots remain responsible for accepted content. */
export interface PreparedContentOwner {
    accept(content: CompositionContent): void;
    has(child: CompositionChild): boolean;
    discard(content: CompositionContent): void;
}

const owners = new WeakMap<object, PreparedContentOwner>();

/** Records transfers without reading elements or retaining released controllers. */
export function createPreparedContentOwner(owner: object, dependencies: readonly object[] = []): PreparedContentOwner {
    const transferred = new WeakSet<object>();
    const abandoned = new WeakSet<object>();
    const ledger: PreparedContentOwner = {
        accept(content) {
            for (const child of toCompositionChildren(content)) {
                if (child && typeof child === "object") transferred.add(child);
            }
        },
        has(child) {
            return Boolean(child && typeof child === "object" && (
                transferred.has(child) || abandoned.has(child)
                || dependencies.some(dependency => owners.get(dependency)?.has(child))
            ));
        },
        discard(content) {
            runCleanups([...new Set(toCompositionChildren(content))].reverse().map(child => () => {
                if (!child || typeof child !== "object" || ledger.has(child)) return;
                const destroy = getDestroyer(child);
                if (!destroy) return;
                abandoned.add(child);
                destroy();
            }));
        }
    };
    owners.set(owner, ledger);
    return ledger;
}

/** Releases an unaccepted batch, never content already transferred to this owner. */
export function discardPreparedContent(owner: object, content: CompositionContent): void {
    const ledger = owners.get(owner);
    if (!ledger) throw new Error("Prepared content owner is not registered.");
    ledger.discard(content);
}
