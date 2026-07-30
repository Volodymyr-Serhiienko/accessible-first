/**
 * Registered overlay entry.
 */
export interface OverlayStackEntry {
    readonly id: string;
    readonly element: HTMLElement;
}

/**
 * Ordered stack of active overlay layers.
 */
export interface OverlayStack {
    add(element: HTMLElement): OverlayStackEntry;
    remove(entry: OverlayStackEntry): void;
    bringToFront(entry: OverlayStackEntry): void;
    getTop(): OverlayStackEntry | null;
    isTop(entry: OverlayStackEntry): boolean;
    getEntries(): OverlayStackEntry[];
    clear(): void;
}
