import { afterEach, describe, expect, it, vi } from "vitest";
import {
    createSpeechEngineRouter,
    createSpeechTask,
    type SpeechEngine,
    type SpeechEngineCapabilities,
    type SpeechPlayback,
    type SpeechPlaybackListener,
    type SpeechPlaybackState,
    type SpeechRequest
} from "../../packages/core/src/speech";

function provider(initial: SpeechPlaybackState = { status: "speaking" }, supported: Partial<SpeechEngineCapabilities> = {}) {
    const playbacks: { playback: SpeechPlayback; emit(state: SpeechPlaybackState): void; listeners: Set<SpeechPlaybackListener> }[] = [];
    const speak = vi.fn((_request: SpeechRequest): SpeechPlayback => {
        let state = initial;
        const listeners = new Set<SpeechPlaybackListener>();
        function emit(next: SpeechPlaybackState): void {
            state = next;
            listeners.forEach((listener) => listener(state));
        }
        const playback: SpeechPlayback = {
            getState: () => state,
            pause: vi.fn(() => emit({ status: "paused" })),
            resume: vi.fn(() => emit({ status: "speaking" })),
            stop: vi.fn(() => emit({ status: "idle" })),
            subscribe(listener) { listeners.add(listener); listener(state); return () => { listeners.delete(listener); }; }
        };
        playbacks.push({ playback, emit, listeners });
        return playback;
    });
    const engine: SpeechEngine = {
        id: "test",
        getCapabilities: () => ({ available: true, pause: true, spelling: true, ...supported }),
        speak,
        stop: vi.fn()
    };
    return { engine, speak, playbacks };
}

const text = { text: "Hello", language: "en-GB" };
const spell = { ...text, mode: "spell" as const, spellWhitespaceText: "space" };

describe("createSpeechEngineRouter", () => {
    afterEach(() => { vi.useRealTimers(); });

    it("inserts silence only at explicit boundaries, without a trailing delay", () => {
        vi.useFakeTimers();
        const audio = provider();
        const boundary = { ...text, pause: 500 };
        const playback = createSpeechEngineRouter({ text: audio.engine,
            getPauseAfterMs: segment => "pause" in segment ? Number(segment.pause) : 0
        }).speak({ segments: [text, boundary, text, boundary] });
        expect(audio.speak).toHaveBeenLastCalledWith({ segments: [text, boundary] });
        audio.playbacks[0]!.emit({ status: "completed" });
        expect(playback.getState().status).toBe("speaking");
        vi.advanceTimersByTime(499);
        expect(audio.speak).toHaveBeenCalledOnce();
        vi.advanceTimersByTime(1);
        expect(audio.speak).toHaveBeenCalledTimes(2);
        audio.playbacks[1]!.emit({ status: "completed" });
        expect(playback.getState().status).toBe("completed");
        expect(vi.getTimerCount()).toBe(0);
    });

    it("suspends the remaining silence on pause, and replacement cancels its timer", () => {
        vi.useFakeTimers();
        const audio = provider();
        const engine = createSpeechEngineRouter({ text: audio.engine, getPauseAfterMs: () => 500 });
        const first = engine.speak({ segments: [text, text] });
        audio.playbacks[0]!.emit({ status: "completed" });
        vi.advanceTimersByTime(200);
        first.pause();
        expect(first.getState().status).toBe("paused");
        vi.advanceTimersByTime(1000);
        expect(audio.speak).toHaveBeenCalledOnce();
        first.resume();
        vi.advanceTimersByTime(299);
        expect(audio.speak).toHaveBeenCalledOnce();
        vi.advanceTimersByTime(1);
        expect(audio.speak).toHaveBeenCalledTimes(2);
        first.stop();
        const second = engine.speak({ segments: [text, text] });
        audio.playbacks[2]!.emit({ status: "completed" });
        engine.speak({ segments: [text] });
        expect(second.getState().status).toBe("idle");
        expect(vi.getTimerCount()).toBe(0);
        vi.advanceTimersByTime(1000);
        expect(audio.speak).toHaveBeenCalledTimes(4);
        engine.stop();
    });

    it("does not bypass silence when a provider completes synchronously", () => {
        vi.useFakeTimers();
        const audio = provider({ status: "completed" });
        const playback = createSpeechEngineRouter({ text: audio.engine, getPauseAfterMs: () => 500 })
            .speak({ segments: [text, text, text] });
        expect(audio.speak).toHaveBeenCalledOnce();
        vi.advanceTimersByTime(500);
        expect(audio.speak).toHaveBeenCalledTimes(2);
        playback.stop();
        vi.runAllTimers();
        expect(audio.speak).toHaveBeenCalledTimes(2);
        expect(audio.playbacks.every(child => child.listeners.size === 0)).toBe(true);
    });

    it("preserves silence if provider completion races with pause", () => {
        vi.useFakeTimers();
        const audio = provider();
        const playback = createSpeechEngineRouter({ text: audio.engine, getPauseAfterMs: () => 500 })
            .speak({ segments: [text, text] });
        playback.pause();
        audio.playbacks[0]!.emit({ status: "completed" });
        expect(vi.getTimerCount()).toBe(0);
        playback.resume();
        vi.advanceTimersByTime(499);
        expect(audio.speak).toHaveBeenCalledOnce();
        vi.advanceTimersByTime(1);
        expect(audio.speak).toHaveBeenCalledTimes(2);
        playback.stop();
    });

    it("supports explicit application channels without overlapping providers", () => {
        const audio = provider();
        const browser = provider();
        const selected = { ...text, channel: "browser" };
        const engine = createSpeechEngineRouter({ text: audio.engine,
            selectEngine: segment => "channel" in segment ? browser.engine : audio.engine });
        const playback = engine.speak({ segments: [text, selected, text] });
        expect(browser.speak).not.toHaveBeenCalled();
        audio.playbacks[0]!.emit({ status: "completed" });
        expect(browser.speak).toHaveBeenCalledWith({ segments: [selected] });
        playback.stop();
        browser.playbacks[0]!.emit({ status: "completed" });
        expect(audio.speak).toHaveBeenCalledOnce();
    });

    it("does not substitute a default provider when a selector refuses or fails", () => {
        const audio = provider();
        const unavailable = createSpeechEngineRouter({ text: audio.engine, selectEngine: () => undefined });
        expect(unavailable.speak({ segments: [text] }).getState().status).toBe("unavailable");
        const failed = createSpeechEngineRouter({ text: audio.engine, selectEngine: () => { throw new Error("invalid channel"); } });
        expect(failed.speak({ segments: [text] }).getState().status).toBe("error");
        expect(audio.speak).not.toHaveBeenCalled();
    });
    it("routes spelling separately, groups adjacent reading segments, and never overlaps providers", () => {
        const audio = provider();
        const browser = provider();
        const engine = createSpeechEngineRouter({ text: audio.engine, spell: browser.engine });
        const request = { segments: [text, { ...text, language: "uk-UA" }, spell, text], rate: 0.8, volume: 0.5 };
        const playback = engine.speak(request);
        request.rate = 2;
        request.volume = 1;
        expect(audio.speak).toHaveBeenCalledWith({ segments: [text, { ...text, language: "uk-UA" }], rate: 0.8, volume: 0.5 });
        expect(browser.speak).not.toHaveBeenCalled();
        audio.playbacks[0]!.emit({ status: "completed" });
        expect(browser.speak).toHaveBeenCalledWith({ segments: [spell], rate: 0.8, volume: 0.5 });
        expect(audio.speak).toHaveBeenCalledTimes(1);
        browser.playbacks[0]!.emit({ status: "completed" });
        expect(audio.speak).toHaveBeenCalledTimes(2);
        audio.playbacks[1]!.emit({ status: "completed" });
        expect(playback.getState()).toEqual({ status: "completed" });
        expect(audio.playbacks.every((child) => child.listeners.size === 0)).toBe(true);
        expect(browser.playbacks[0]!.listeners.size).toBe(0);
    });

    it("delegates pause/resume to the active provider and stop cancels the remaining groups", () => {
        const audio = provider();
        const browser = provider();
        const engine = createSpeechEngineRouter({ text: audio.engine, spell: browser.engine });
        const playback = engine.speak({ segments: [text, spell] });
        playback.pause();
        expect(playback.getState().status).toBe("paused");
        expect(audio.playbacks[0]!.playback.pause).toHaveBeenCalledOnce();
        playback.resume();
        expect(playback.getState().status).toBe("speaking");
        playback.stop();
        audio.playbacks[0]!.emit({ status: "completed" });
        expect(playback.getState().status).toBe("idle");
        expect(browser.speak).not.toHaveBeenCalled();
    });

    it("keeps the next provider paused when completion races with pause", () => {
        const audio = provider();
        const browser = provider();
        const playback = createSpeechEngineRouter({ text: audio.engine, spell: browser.engine }).speak({ segments: [text, spell] });
        playback.pause();
        audio.playbacks[0]!.emit({ status: "completed" });
        expect(browser.speak).not.toHaveBeenCalled();
        playback.resume();
        expect(browser.speak).toHaveBeenCalledOnce();
    });

    it("replaces requests and ignores an old provider's late completion", () => {
        const audio = provider();
        const browser = provider();
        const engine = createSpeechEngineRouter({ text: audio.engine, spell: browser.engine });
        const first = engine.speak({ segments: [text, spell] });
        const second = engine.speak({ segments: [spell] });
        audio.playbacks[0]!.emit({ status: "completed" });
        expect(first.getState().status).toBe("idle");
        expect(second.getState().status).toBe("speaking");
        expect(browser.speak).toHaveBeenCalledOnce();
        engine.stop();
    });

    it("does not turn unavailable spelling into ordinary reading or start part of the request", () => {
        const audio = provider();
        const engine = createSpeechEngineRouter({ text: audio.engine });
        expect(engine.getCapabilities().spelling).toBe(false);
        expect(engine.speak({ segments: [text, spell] }).getState()).toEqual({ status: "unavailable" });
        expect(audio.speak).not.toHaveBeenCalled();
        const browser = provider({ status: "speaking" }, { spelling: false });
        expect(createSpeechEngineRouter({ text: audio.engine, spell: browser.engine }).speak({ segments: [spell] }).getState().status).toBe("unavailable");
    });

    it("preserves a dedicated space for the spelling provider but skips whitespace in text mode", () => {
        const audio = provider();
        const space = { text: " ", language: "en-GB", mode: "spell" as const, spellWhitespaceText: "space" };
        createSpeechEngineRouter({ text: audio.engine, spell: audio.engine }).speak({ segments: [{ ...text, text: " " }, space] });
        expect(audio.speak).toHaveBeenCalledWith({ segments: [space] });
    });

    it("exposes only capabilities supported by its configured providers", () => {
        const audio = provider({ status: "speaking" }, { spelling: false });
        const browser = provider({ status: "speaking" }, { pause: false });
        expect(createSpeechEngineRouter({ text: audio.engine, spell: browser.engine }).getCapabilities()).toEqual({
            available: true, pause: false, spelling: true
        });
        browser.engine.getCapabilities = () => { throw new Error("Partial browser"); };
        expect(createSpeechEngineRouter({ text: audio.engine, spell: browser.engine }).getCapabilities()).toEqual({
            available: true, pause: true, spelling: false
        });
    });

    it("preserves provider errors and prevents the following provider from starting", () => {
        const audio = provider({ status: "error", error: "audio-playback-blocked" });
        const browser = provider();
        const playback = createSpeechEngineRouter({ text: audio.engine, spell: browser.engine }).speak({ segments: [text, spell] });
        expect(playback.getState()).toEqual({ status: "error", error: "audio-playback-blocked" });
        expect(browser.speak).not.toHaveBeenCalled();
        expect(audio.playbacks[0]!.listeners.size).toBe(0);
    });

    it("handles many synchronously completed routes without recursion or leaked subscriptions", () => {
        const audio = provider({ status: "completed" });
        const browser = provider({ status: "completed" });
        const segments = Array.from({ length: 2000 }, (_, index) => index % 2 ? spell : text);
        const playback = createSpeechEngineRouter({ text: audio.engine, spell: browser.engine }).speak({ segments });
        expect(playback.getState().status).toBe("completed");
        expect(audio.speak).toHaveBeenCalledTimes(1000);
        expect(browser.speak).toHaveBeenCalledTimes(1000);
        expect([...audio.playbacks, ...browser.playbacks].every((child) => child.listeners.size === 0)).toBe(true);
    });

    it("handles an empty request and a provider that throws during startup", () => {
        const audio = provider();
        const engine = createSpeechEngineRouter({ text: audio.engine });
        expect(engine.speak({ segments: [] }).getState().status).toBe("completed");
        audio.speak.mockImplementationOnce(() => { throw new Error("Provider failed"); });
        expect(engine.speak({ segments: [text] }).getState()).toEqual({ status: "error", error: "speech-engine-routing-failed" });
    });

    it("integrates routed spelling with the existing task cancellation and completion contract", () => {
        const audio = provider();
        const browser = provider();
        const task = createSpeechTask(createSpeechEngineRouter({ text: audio.engine, spell: browser.engine }));
        const complete = vi.fn();
        task.speak({ segments: [spell, text] }, { onComplete: complete });
        browser.playbacks[0]!.emit({ status: "completed" });
        audio.playbacks[0]!.emit({ status: "completed" });
        expect(complete).toHaveBeenCalledOnce();
        task.speak({ segments: [text, spell] }, { onComplete: complete });
        task.destroy();
        audio.playbacks[1]!.emit({ status: "completed" });
        expect(complete).toHaveBeenCalledOnce();
        expect(browser.speak).toHaveBeenCalledTimes(1);
    });
});
