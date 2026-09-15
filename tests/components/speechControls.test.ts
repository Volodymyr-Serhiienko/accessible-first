import { afterEach, describe, expect, it, vi } from "vitest";
import {
    SpeechButton,
    SpeechControls
} from "../../packages/components/src";
import type {
    SpeechEngine,
    SpeechPlayback,
    SpeechPlaybackListener,
    SpeechPlaybackState
} from "../../packages/core/src/speech";

interface MutablePlayback {
    readonly playback: SpeechPlayback;
    setState(status: SpeechPlaybackState["status"]): void;
}

function createPlayback(
    initialStatus: SpeechPlaybackState["status"] = "speaking"
): MutablePlayback {
    const listeners = new Set<SpeechPlaybackListener>();
    let state: SpeechPlaybackState = { status: initialStatus };

    function setState(status: SpeechPlaybackState["status"]): void {
        state = { status };
        listeners.forEach((listener) => listener(state));
    }

    return {
        playback: {
            getState(): SpeechPlaybackState {
                return state;
            },

            pause(): void {
                setState("paused");
            },

            resume(): void {
                setState("speaking");
            },

            stop(): void {
                setState("idle");
            },

            subscribe(listener: SpeechPlaybackListener): () => void {
                listeners.add(listener);
                listener(state);

                return () => {
                    listeners.delete(listener);
                };
            }
        },

        setState
    };
}

function createEngine(playback: SpeechPlayback): SpeechEngine {
    return {
        id: "test-speech",
        getCapabilities: () => ({
            available: true,
            pause: true,
            spelling: true
        }),
        speak: vi.fn(() => playback),
        stop: vi.fn()
    };
}

afterEach(() => {
    document.body.replaceChildren();
});

describe("speech composition", () => {
    it("keeps pause and stop unavailable until speech starts, then synchronizes playback controls", () => {
        const mutablePlayback = createPlayback();
        const engine = createEngine(mutablePlayback.playback);
        const controls = SpeechControls({
            engine,
            request: {
                segments: [{ text: "Hello", language: "en" }]
            },
            label: "Speech controls",
            startText: "Listen",
            pauseText: "Pause",
            resumeText: "Resume",
            stopText: "Stop",
            pausedText: "Speech paused.",
            stoppedText: "Speech stopped."
        });

        document.body.append(controls.element);

        expect(controls.pauseButton.element.disabled).toBe(true);
        expect(controls.stopButton.element.disabled).toBe(true);

        controls.startButton.element.click();

        expect(engine.speak).toHaveBeenCalledTimes(1);
        expect(controls.pauseButton.element.disabled).toBe(false);
        expect(controls.stopButton.element.disabled).toBe(false);

        controls.pauseButton.element.click();

        expect(controls.pauseButton.element.textContent).toBe("Resume");
        expect(controls.statusMessage.getText()).toBe("Speech paused.");

        controls.pauseButton.element.click();

        expect(controls.pauseButton.element.textContent).toBe("Pause");

        controls.stopButton.element.click();

        expect(controls.pauseButton.element.disabled).toBe(true);
        expect(controls.stopButton.element.disabled).toBe(true);
        expect(controls.statusMessage.getText()).toBe("Speech stopped.");

        controls.destroy();
    });

    it("gives compact speech actions a name and delegates unavailable playback to the application", () => {
        const mutablePlayback = createPlayback("unavailable");
        const onUnavailable = vi.fn();
        const button = SpeechButton({
            engine: createEngine(mutablePlayback.playback),
            request: {
                segments: [{ text: "Hello", language: "en" }]
            },
            label: "Listen to Hello",
            onUnavailable
        });

        document.body.append(button.element);
        button.element.click();

        expect(button.element.getAttribute("aria-label")).toBe("Listen to Hello");
        expect(onUnavailable).toHaveBeenCalledTimes(1);

        button.destroy();
    });
});
