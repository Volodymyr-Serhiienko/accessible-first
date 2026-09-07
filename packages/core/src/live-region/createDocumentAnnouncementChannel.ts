import { createAnnouncer } from "./createAnnouncer";
import type {
    AnnounceOptions,
    Announcer,
    AnnouncerOptions,
    DocumentAnnouncementChannel,
    DocumentAnnouncementChannelOptions,
    LiveRegionPoliteness
} from "./types";

interface DocumentAnnouncementCoordinator {
    readonly announcer: Announcer;
    readonly channels: Set<DocumentAnnouncementChannel>;
    readonly activeChannels: Map<
        LiveRegionPoliteness,
        DocumentAnnouncementChannel
    >;
}

const coordinators = new WeakMap<Document, DocumentAnnouncementCoordinator>();

function getCoordinatorOptions(
    ownerDocument: Document,
    options: DocumentAnnouncementChannelOptions
): AnnouncerOptions {
    const announcerOptions: AnnouncerOptions = {
        container: ownerDocument.body ?? ownerDocument.documentElement
    };

    if (options.atomic !== undefined) {
        announcerOptions.atomic = options.atomic;
    }

    return announcerOptions;
}

function getCoordinator(
    ownerDocument: Document,
    options: DocumentAnnouncementChannelOptions
): DocumentAnnouncementCoordinator {
    const existing = coordinators.get(ownerDocument);

    if (existing) {
        return existing;
    }

    const coordinator: DocumentAnnouncementCoordinator = {
        announcer: createAnnouncer(
            getCoordinatorOptions(ownerDocument, options)
        ),
        channels: new Set(),
        activeChannels: new Map()
    };

    coordinators.set(ownerDocument, coordinator);

    return coordinator;
}

/**
 * Creates a source-owned channel that shares one polite/assertive live-region
 * pair with other Accessible First channels in the same document.
 *
 * A channel can clear only announcements it owns. This prevents a component
 * cleanup or validation update from erasing a newer message from another
 * framework component.
 */
export function createDocumentAnnouncementChannel(
    options: DocumentAnnouncementChannelOptions = {}
): DocumentAnnouncementChannel {
    const ownerDocument = options.document ?? document;
    const coordinator = getCoordinator(ownerDocument, options);

    let channel!: DocumentAnnouncementChannel;
    let destroyed = false;

    function clearPoliteness(politeness: LiveRegionPoliteness): void {
        if (coordinator.activeChannels.get(politeness) !== channel) {
            return;
        }

        coordinator.activeChannels.delete(politeness);
        coordinator.announcer.clear({ politeness });
    }

    function clear(clearOptions: AnnounceOptions = {}): void {
        if (destroyed) {
            return;
        }

        if (clearOptions.politeness !== undefined) {
            clearPoliteness(clearOptions.politeness);
            return;
        }

        clearPoliteness("polite");
        clearPoliteness("assertive");
    }

    channel = {
        announce(
            message: string,
            announceOptions: AnnounceOptions = {}
        ): void {
            if (destroyed) {
                return;
            }

            const text = message.trim();

            if (!text) {
                return;
            }

            const politeness = announceOptions.politeness ?? "polite";

            coordinator.activeChannels.set(politeness, channel);
            coordinator.announcer.announce(text, { politeness });
        },

        clear,

        destroy(): void {
            if (destroyed) {
                return;
            }

            clear();
            destroyed = true;
            coordinator.channels.delete(channel);

            if (coordinator.channels.size > 0) {
                return;
            }

            coordinator.announcer.destroy();
            coordinators.delete(ownerDocument);
        }
    };

    coordinator.channels.add(channel);

    return channel;
}
