import {
    describe,
    expect,
    it
} from "vitest";
import {
    createValidationAnnouncer,
    shouldAnnounceValidationFeedback
} from "../../../packages/core/src/validation-announcements";
import type {
    Announcer
} from "../../../packages/core/src/live-region";

interface RecordedAnnouncement {
    message: string;
    politeness: string | undefined;
}

function createRecordingAnnouncer(): {
    announcer: Announcer;
    announcements: RecordedAnnouncement[];
    readonly clearCount: number;
    readonly destroyCount: number;
} {
    const announcements: RecordedAnnouncement[] = [];
    let clearCount = 0;
    let destroyCount = 0;

    return {
        announcer: {
            announce(message, options): void {
                announcements.push({
                    message,
                    politeness: options?.politeness
                });
            },

            clear(): void {
                clearCount += 1;
            },

            destroy(): void {
                destroyCount += 1;
            }
        },

        announcements,

        get clearCount(): number {
            return clearCount;
        },

        get destroyCount(): number {
            return destroyCount;
        }
    };
}

describe("validation announcements", () => {
    it("keeps automatic validation quiet when focus already explains an invalid field", () => {
        expect(shouldAnnounceValidationFeedback()).toBe(true);

        expect(shouldAnnounceValidationFeedback({
            willMoveFocus: true
        })).toBe(false);

        expect(shouldAnnounceValidationFeedback({
            willMoveFocus: true,
            hasSummary: true
        })).toBe(true);

        expect(shouldAnnounceValidationFeedback({
            strategy: true,
            willMoveFocus: true
        })).toBe(true);

        expect(shouldAnnounceValidationFeedback({
            strategy: true,
            announce: false
        })).toBe(false);
    });

    it("formats field feedback and respects an injected announcer lifecycle", () => {
        const recording = createRecordingAnnouncer();
        const control = document.createElement("input");
        const label = document.createElement("label");

        control.id = "lesson-name";
        label.htmlFor = control.id;
        label.textContent = "Lesson name";

        document.body.append(label, control);

        const validationAnnouncer = createValidationAnnouncer({
            announcer: recording.announcer,
            successMessage: "Lesson saved."
        });

        validationAnnouncer.announceError({
            control,
            message: "Enter a lesson name."
        });

        validationAnnouncer.announceSuccess();

        expect(recording.announcements).toEqual([
            {
                message: "Lesson name: Enter a lesson name.",
                politeness: "assertive"
            },
            {
                message: "Lesson saved.",
                politeness: "polite"
            }
        ]);

        validationAnnouncer.clear();

        expect(recording.clearCount).toBe(1);

        validationAnnouncer.destroy();

        expect(recording.clearCount).toBe(2);
        expect(recording.destroyCount).toBe(0);
    });
});
