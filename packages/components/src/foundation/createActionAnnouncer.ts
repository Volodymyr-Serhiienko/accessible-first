import {
    createAnnouncer as createCoreAnnouncer,
    type AnnounceOptions,
    type Announcer,
    type AnnouncerOptions,
    type LiveRegionPoliteness
} from "../../../core/src/live-region";

/**
 * Screen reader politeness used by action announcements.
 */
export type ActionAnnouncementPoliteness = LiveRegionPoliteness;

/**
 * Options for one action announcement.
 */
export interface ActionAnnounceOptions extends AnnounceOptions {}

/**
 * Options for createActionAnnouncer().
 */
export interface ActionAnnouncerOptions extends AnnouncerOptions {
    /** Default politeness for announcements. Defaults to "polite". */
    politeness?: ActionAnnouncementPoliteness;
}

/**
 * Controller for announcing user-action results through a managed live region.
 */
export interface ActionAnnouncer {
    announce(message: string | null | undefined, options?: ActionAnnounceOptions): void;
    clear(): void;
    destroy(): void;
}

function getCoreAnnouncerOptions(options: ActionAnnouncerOptions): AnnouncerOptions {
    const coreOptions: AnnouncerOptions = {};

    if (options.container !== undefined) coreOptions.container = options.container;
    if (options.atomic !== undefined) coreOptions.atomic = options.atomic;

    return coreOptions;
}

/**
 * Creates a small app-level announcer for success, error, navigation, and async action feedback.
 */
export function createActionAnnouncer(options: ActionAnnouncerOptions = {}): ActionAnnouncer {
    const announcer: Announcer = createCoreAnnouncer(getCoreAnnouncerOptions(options));
    const defaultPoliteness = options.politeness ?? "polite";

    return {
        announce(message, announceOptions = {}): void {
            const text = message?.trim();

            if (!text) return;

            announcer.announce(text, {
                politeness: announceOptions.politeness ?? defaultPoliteness
            });
        },

        clear(): void {
            announcer.clear();
        },

        destroy(): void {
            announcer.destroy();
        }
    };
}
