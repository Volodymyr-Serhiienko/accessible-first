import { describe, expect, it } from "vitest";
import {
    afterSpeechCompletes,
    afterSpeechSettles,
    type SpeechPlayback,
    type SpeechPlaybackState
} from "../../packages/core/src/speech";

function createPlayback(initialState: SpeechPlaybackState): {
    readonly playback: SpeechPlayback;
    emit(state: SpeechPlaybackState): void;
    getListenerCount(): number;
} {
    let state = initialState;
    const listeners = new Set<(nextState: SpeechPlaybackState) => void>();

    return {
        playback: {
            getState(): SpeechPlaybackState {
                return state;
            },
            pause(): void {},
            resume(): void {},
            stop(): void {},
            subscribe(listener): () => void {
                listeners.add(listener);
                listener(state);

                return () => listeners.delete(listener);
            }
        },
        emit(nextState): void {
            state = nextState;
            listeners.forEach((listener) => listener(state));
        },
        getListenerCount(): number {
            return listeners.size;
        }
    };
}

describe("speech playback follow-ups", () => {
    it("runs a completion follow-up once and ignores other terminal states", () => {
        const source = createPlayback({ status: "speaking" });
        let calls = 0;

        afterSpeechCompletes(source.playback, () => {
            calls += 1;
        });

        source.emit({ status: "idle" });
        source.emit({ status: "completed" });
        source.emit({ status: "completed" });

        expect(calls).toBe(1);
    });

    it("settles after an unavailable or failed request and supports cancellation", () => {
        const unavailable = createPlayback({ status: "unavailable" });
        const cancelled = createPlayback({ status: "speaking" });
        let unavailableCalls = 0;
        let cancelledCalls = 0;

        afterSpeechSettles(unavailable.playback, () => {
            unavailableCalls += 1;
        });
        const cancel = afterSpeechSettles(cancelled.playback, () => {
            cancelledCalls += 1;
        });

        cancel();
        cancelled.emit({ status: "error", error: "Cancelled view" });

        expect(unavailableCalls).toBe(1);
        expect(cancelledCalls).toBe(0);
        expect(unavailable.getListenerCount()).toBe(0);
    });
});
