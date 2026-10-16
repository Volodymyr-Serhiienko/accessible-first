import { describe, expect, it, vi } from "vitest";
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

    it("releases a synchronous terminal subscription before a throwing follow-up", () => {
        const source = createPlayback({ status: "completed" });
        expect(() => afterSpeechSettles(source.playback, () => { throw new Error("follow-up"); })).toThrow("follow-up");
        expect(source.getListenerCount()).toBe(0);
    });

    it("runs the follow-up once even if terminal unsubscription fails", () => {
        const source = createPlayback({ status: "speaking" });
        const subscribe = source.playback.subscribe;
        const released = vi.fn();
        source.playback.subscribe = listener => {
            const unsubscribe = subscribe(listener);
            return () => { released(); unsubscribe(); throw new Error("unsubscribe"); };
        };
        const followUp = vi.fn(); const cancel = afterSpeechCompletes(source.playback, followUp);
        expect(() => source.emit({ status: "completed" })).toThrow("unsubscribe");
        source.emit({ status: "completed" }); cancel();
        expect(followUp).toHaveBeenCalledOnce(); expect(released).toHaveBeenCalledOnce(); expect(source.getListenerCount()).toBe(0);
    });

    it("makes cancellation terminal before a throwing unsubscribe", () => {
        const source = createPlayback({ status: "speaking" });
        const subscribe = source.playback.subscribe;
        source.playback.subscribe = listener => { subscribe(listener); return () => { throw new Error("unsubscribe"); }; };
        const followUp = vi.fn(); const cancel = afterSpeechSettles(source.playback, followUp);
        expect(cancel).toThrow("unsubscribe"); expect(cancel).not.toThrow();
        source.emit({ status: "completed" }); expect(followUp).not.toHaveBeenCalled();
    });

    it("ignores callbacks retained by a provider whose subscribe failed", () => {
        const source = createPlayback({ status: "speaking" });
        const subscribe = source.playback.subscribe;
        source.playback.subscribe = listener => { subscribe(listener); throw new Error("subscribe"); };
        const followUp = vi.fn();
        expect(() => afterSpeechSettles(source.playback, followUp)).toThrow("subscribe");
        source.emit({ status: "completed" }); expect(followUp).not.toHaveBeenCalled();
    });
});
