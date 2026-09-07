import {
    createDocumentAnnouncementChannel,
    type AnnounceOptions,
    type AnnouncerOptions,
    type DocumentAnnouncementChannel,
    type DocumentAnnouncementChannelOptions,
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
 *
 * When container is supplied, its owner document determines the shared
 * document-level announcement channel.
 */
export interface ActionAnnouncerOptions extends AnnouncerOptions {
    /** Default politeness for announcements. Defaults to "polite". */
    politeness?: ActionAnnouncementPoliteness;
}

/**
 * Controller for announcing user-action results through a managed live region.
 */
export interface ActionAnnouncer {
    announce(
        message: string | null | undefined,
        options?: ActionAnnounceOptions
    ): void;
    clear(): void;
    destroy(): void;
}

function getChannelOptions(
    options: ActionAnnouncerOptions
): DocumentAnnouncementChannelOptions {
    const channelOptions: DocumentAnnouncementChannelOptions = {};

    if (options.container !== undefined) {
        channelOptions.document = options.container.ownerDocument;
    }

    if (options.atomic !== undefined) {
        channelOptions.atomic = options.atomic;
    }

    return channelOptions;
}

/**
 * Creates an app-level announcer for success, error, navigation, and async
 * action feedback. It coordinates with other framework action and validation
 * announcements in the same document.
 */
export function createActionAnnouncer(
    options: ActionAnnouncerOptions = {}
): ActionAnnouncer {
    const announcer: DocumentAnnouncementChannel =
        createDocumentAnnouncementChannel(getChannelOptions(options));

    const defaultPoliteness = options.politeness ?? "polite";

    return {
        announce(message, announceOptions = {}): void {
            const text = message?.trim();

            if (!text) {
                return;
            }

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
