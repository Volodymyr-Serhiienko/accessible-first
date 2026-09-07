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
 * Options for one announcement or clear operation.
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
    clear(options?: AnnounceOptions): void;
    destroy(): void;
}

/**
 * Options for a channel coordinated within one browser document.
 */
export interface DocumentAnnouncementChannelOptions {
    document?: Document;
    atomic?: boolean;
}

/**
 * A source-owned announcement channel that shares document-level live regions.
 */
export interface DocumentAnnouncementChannel extends Announcer {}
