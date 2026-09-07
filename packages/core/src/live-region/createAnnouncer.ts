import { createLiveRegion } from "./createLiveRegion";
import type {
    AnnounceOptions,
    Announcer,
    AnnouncerOptions,
    LiveRegionOptions
} from "./types";

function getLiveRegionOptions(
    options: AnnouncerOptions,
    politeness: "polite" | "assertive"
): LiveRegionOptions {
    const liveRegionOptions: LiveRegionOptions = {
        politeness
    };

    if (options.container) {
        liveRegionOptions.container = options.container;
    }

    if (options.atomic !== undefined) {
        liveRegionOptions.atomic = options.atomic;
    }

    return liveRegionOptions;
}

/**
 * Creates an isolated announcer with polite and assertive live regions.
 *
 * Use createDocumentAnnouncementChannel() for ordinary app and component
 * feedback that should coordinate with other Accessible First emitters.
 */
export function createAnnouncer(
    options: AnnouncerOptions = {}
): Announcer {
    const politeRegion = createLiveRegion(
        getLiveRegionOptions(options, "polite")
    );

    const assertiveRegion = createLiveRegion(
        getLiveRegionOptions(options, "assertive")
    );

    let destroyed = false;

    function clear(clearOptions: AnnounceOptions = {}): void {
        if (destroyed) {
            return;
        }

        const politeness = clearOptions.politeness;

        if (politeness === undefined || politeness === "polite") {
            politeRegion.clear();
        }

        if (politeness === undefined || politeness === "assertive") {
            assertiveRegion.clear();
        }
    }

    return {
        announce(message: string, announceOptions: AnnounceOptions = {}): void {
            if (destroyed) {
                return;
            }

            const region =
                announceOptions.politeness === "assertive"
                    ? assertiveRegion
                    : politeRegion;

            region.announce(message);
        },

        clear,

        destroy(): void {
            if (destroyed) {
                return;
            }

            clear();
            destroyed = true;
            politeRegion.destroy();
            assertiveRegion.destroy();
        }
    };
}
