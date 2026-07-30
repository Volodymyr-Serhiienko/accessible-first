import { createId } from "../id";
import type {
    OverlayStack,
    OverlayStackEntry
} from "./types";

/**
 * Creates an overlay stack.
 *
 * The stack tracks active overlay entries in order so dismissal and focus
 * behavior can target only the topmost layer.
 */
export function createOverlayStack(): OverlayStack {
    let entries: OverlayStackEntry[] = [];

    function remove(entry: OverlayStackEntry): void {
        entries = entries.filter((candidate) => candidate !== entry);
    }

    function add(element: HTMLElement): OverlayStackEntry {
        const entry: OverlayStackEntry = {
            id: createId("af-overlay"),
            element
        };

        entries = entries.filter((candidate) => candidate.element !== element);
        entries.push(entry);

        return entry;
    }

    function bringToFront(entry: OverlayStackEntry): void {
        remove(entry);
        entries.push(entry);
    }

    function getTop(): OverlayStackEntry | null {
        return entries[entries.length - 1] ?? null;
    }

    return {
        add,
        remove,
        bringToFront,
        getTop,

        isTop(entry: OverlayStackEntry): boolean {
            return getTop() === entry;
        },

        getEntries(): OverlayStackEntry[] {
            return [...entries];
        },

        clear(): void {
            entries = [];
        }
    };
}
