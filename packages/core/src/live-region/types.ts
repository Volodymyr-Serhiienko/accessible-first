/**
 * Defines the politeness levels for screen reader announcements in a live region.
 * - "polite": Announces changes when the user is idle.
 * - "assertive": Interrupts the user to announce changes immediately.
 */
export type LiveRegionPoliteness = "polite" | "assertive";

/**
 * Configuration options for creating an individual accessible live region.
 */
export interface LiveRegionOptions {
    container?: HTMLElement;
    politeness?: LiveRegionPoliteness;
    atomic?: boolean;
}

/**
 * Interface representing a specific, managed DOM element acting as an ARIA live region.
 */
export interface LiveRegion {
    readonly element: HTMLElement;
    announce(message: string): void;
    clear(): void;
    destroy(): void;
}

/**
 * Overriding options for an individual announcement call.
 */
export interface AnnounceOptions {
    politeness?: LiveRegionPoliteness;
}

/**
 * Configuration options for a global or contextual announcer manager.
 */
export interface AnnouncerOptions {
    container?: HTMLElement;
    atomic?: boolean;
}

/**
 * Interface for a high-level manager that handles text announcements 
 * by dynamically coordinating live regions based on politeness levels.
 */
export interface Announcer {
    announce(message: string, options?: AnnounceOptions): void;
    clear(): void;
    destroy(): void;
}
