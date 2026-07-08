/**
 * Represents an individual registered overlay tracked inside a stacked layout queue.
 */
export interface OverlayStackEntry {
    readonly id: string;
    readonly element: HTMLElement;
}

/**
 * Interface representing a centralized layer manager tracking viewport overlays.
 * Coordinates z-index hierarchy balances, multi-modal focus orders, and escape sequence 
 * dismissal priorities by evaluating top-to-bottom entry lists.
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
