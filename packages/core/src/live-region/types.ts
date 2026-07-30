/**
 * Screen reader announcement politeness.
 */
export type LiveRegionPoliteness = "polite" | "assertive";

/**
 * Options for createLiveRegion().
 */
export interface LiveRegionOptions {
    container?: HTMLElement;
    politeness?: LiveRegionPoliteness;
    atomic?: boolean;
}

/**
 * Controller returned by createLiveRegion().
 */
export interface LiveRegion {
    readonly element: HTMLElement;
    announce(message: string): void;
    clear(): void;
    destroy(): void;
}

/**
 * Options for one announcement.
 */
export interface AnnounceOptions {
    politeness?: LiveRegionPoliteness;
}

/**
 * Options for createAnnouncer().
 */
export interface AnnouncerOptions {
    container?: HTMLElement;
    atomic?: boolean;
}

/**
 * Controller returned by createAnnouncer().
 */
export interface Announcer {
    announce(message: string, options?: AnnounceOptions): void;
    clear(): void;
    destroy(): void;
}
