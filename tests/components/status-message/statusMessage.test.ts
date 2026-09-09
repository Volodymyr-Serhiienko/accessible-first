import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    type ActionAnnouncer
} from "../../../packages/components/src/foundation";
import {
    StatusMessage
} from "../../../packages/components/src/status-message";

const announcementDelay = 50;

interface RecordedAnnouncement {
    message: string | null | undefined;
    politeness: string | undefined;
}

describe("StatusMessage", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows a visible update and announces it only when explicitly requested", () => {
        const status = StatusMessage({
            hidden: true
        });

        document.body.append(status.element);

        expect(status.element.hidden).toBe(true);

        status.update({
            icon: "Done",
            text: "Draft saved.",
            variant: "success",
            hidden: false,
            announcement: true
        });

        expect(status.element.hidden).toBe(false);
        expect(status.element.getAttribute("data-af-variant")).toBe("success");
        expect(status.getText()).toBe("Draft saved.");
        expect(status.icon.hidden).toBe(false);
        expect(status.icon.getAttribute("aria-hidden")).toBe("true");

        vi.advanceTimersByTime(announcementDelay);

        const politeText = [
            ...document.querySelectorAll<HTMLElement>('[aria-live="polite"]')
        ].map((region) => region.textContent);

        expect(politeText).toContain("Draft saved.");

        status.update({
            text: "Draft changed.",
            announcement: false
        });

        vi.advanceTimersByTime(announcementDelay);

        const nextPoliteText = [
            ...document.querySelectorAll<HTMLElement>('[aria-live="polite"]')
        ].map((region) => region.textContent);

        expect(nextPoliteText).not.toContain("Draft changed.");

        status.destroy();

        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);
    });

    it("uses an injected announcer without taking ownership of its lifecycle", () => {
        const announcements: RecordedAnnouncement[] = [];
        let destroyCount = 0;

        const announcer: ActionAnnouncer = {
            announce(message, options): void {
                announcements.push({
                    message,
                    politeness: options?.politeness
                });
            },

            clear(): void {},

            destroy(): void {
                destroyCount += 1;
            }
        };

        const status = StatusMessage({
            text: "Ready",
            announcer
        });

        status.setText("Preferences saved.", {
            announcement: true
        });

        status.update({
            text: "Import failed.",
            variant: "danger",
            announcement(detail) {
                return `${detail.variant}: ${detail.text}`;
            },
            announcementPoliteness: "assertive"
        });

        status.announce("Retry requested.");

        expect(announcements).toEqual([
            {
                message: "Preferences saved.",
                politeness: "polite"
            },
            {
                message: "danger: Import failed.",
                politeness: "assertive"
            },
            {
                message: "Retry requested.",
                politeness: "assertive"
            }
        ]);

        status.destroy();

        expect(destroyCount).toBe(0);
    });
});
