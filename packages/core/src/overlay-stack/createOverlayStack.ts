import { createId } from "../id";
import type {
    OverlayStack,
    OverlayStackEntry
} from "./types";

/**
 * Creates and initializes a centralized overlay tracking stack instance.
 * Maintains an ordered registry array representing stacked DOM surfaces (e.g., nested modals, menus, or tooltips),
 * providing explicit mechanics to deduplicate elements, shift existing entries to the front of the viewport hierarchy,
 * and track the topmost surface layer for escape-key or focus management patterns.
 *
 * @returns An OverlayStack management engine instance exposing stack array manipulation hooks.
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
