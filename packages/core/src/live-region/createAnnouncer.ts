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
 * Creates an accessibility announcer manager that instantiates and coordinates two 
 * distinct ARIA live regions: one polite and one assertive.
 * Combines them into a unified manager to stream messages to screen readers based on context urgency.
 *
 * @param options - General configuration settings for the internal live regions. Defaults to an empty object.
 * @returns An Announcer object capable of broadcasting messages, flushing regions, and cleaning up nodes.
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

        clear(): void {
            politeRegion.clear();
            assertiveRegion.clear();
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;
            politeRegion.destroy();
            assertiveRegion.destroy();
        }
    };
}
