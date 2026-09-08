import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    createDocumentAnnouncementChannel
} from "../../../packages/core/src/live-region";

const announcementDelay = 50;

function getPoliteRegions(): HTMLElement[] {
    return [...document.querySelectorAll<HTMLElement>('[aria-live="polite"]')];
}

describe("createDocumentAnnouncementChannel", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shares document live regions and preserves announcements owned by another channel", () => {
        const first = createDocumentAnnouncementChannel({ document });
        const second = createDocumentAnnouncementChannel({ document });

        expect(document.querySelectorAll("[data-af-live-region]")).toHaveLength(2);

        first.announce("First message");
        vi.advanceTimersByTime(announcementDelay);

        second.announce("Second message");
        vi.advanceTimersByTime(announcementDelay);

        first.clear();

        expect(getPoliteRegions().map((region) => region.textContent))
            .toContain("Second message");

        first.destroy();

        expect(document.querySelectorAll("[data-af-live-region]")).toHaveLength(2);

        second.destroy();

        expect(document.querySelectorAll("[data-af-live-region]")).toHaveLength(0);
    });

    it("alternates regions when the same message is announced repeatedly", () => {
        const channel = createDocumentAnnouncementChannel({ document });
        const regions = getPoliteRegions();

        channel.announce("Saved");
        vi.advanceTimersByTime(announcementDelay);

        const firstIndex = regions.findIndex(
            (region) => region.textContent === "Saved"
        );

        channel.announce("Saved");
        vi.advanceTimersByTime(announcementDelay);

        const secondIndex = regions.findIndex(
            (region) => region.textContent === "Saved"
        );

        expect(firstIndex).not.toBe(-1);
        expect(secondIndex).not.toBe(-1);
        expect(secondIndex).not.toBe(firstIndex);

        channel.destroy();
    });
});
