import { describe, expect, it } from "vitest";
import { createSpeechTask, type SpeechEngine, type SpeechPlaybackState } from "../../packages/core/src/speech";

function fixture() {
    let state: SpeechPlaybackState = { status: "speaking" };
    const listeners = new Set<(value: SpeechPlaybackState) => void>();
    const emit = (value: SpeechPlaybackState): void => { state = value; for (const listener of listeners) listener(state); };
    const engine: SpeechEngine = {
        id: "test", getCapabilities: () => ({ available: true, pause: false, spelling: true }), stop(): void {},
        speak: () => ({ getState: () => state, pause(): void {}, resume(): void {}, stop: () => emit({ status: "idle" }),
            subscribe: listener => { listeners.add(listener); listener(state); return () => listeners.delete(listener); } })
    };
    return { engine, emit, listeners };
}
const request = { segments: [{ text: "test", language: "en" }] };

describe("createSpeechTask", () => {
    it("still stops playback and disposes when subscription cleanup fails", () => {
        const { engine, listeners } = fixture();
        const speak = engine.speak;
        let stops = 0;
        let requests = 0;
        engine.speak = request => {
            requests++;
            const current = speak(request);
            return { ...current, stop() { stops++; current.stop(); },
                subscribe(listener) {
                    const cleanup = current.subscribe(listener);
                    return () => { cleanup(); throw new Error("unsubscribe failed"); };
                } };
        };
        const task = createSpeechTask(engine);
        task.speak(request);
        expect(() => task.destroy()).toThrow("unsubscribe failed");
        expect(stops).toBe(1);
        expect(listeners.size).toBe(0);
        task.speak(request);
        expect(requests).toBe(1);
    });

    it("keeps newer speech started reentrantly while an old request is stopped", () => {
        const { engine, emit } = fixture();
        const speak = engine.speak;
        const seen: string[] = [];
        let restart = true;
        let completions = 0;
        const task = createSpeechTask(engine);
        engine.speak = value => {
            seen.push(value.segments[0]!.text);
            return { ...speak(value), stop() {
                if (!restart) return;
                restart = false;
                task.speak({ segments: [{ text: "newest", language: "en" }] },
                    { onComplete: () => { completions++; } });
            } };
        };
        task.speak(request);
        task.speak({ segments: [{ text: "obsolete", language: "en" }] });
        expect(seen).toEqual(["test", "newest"]);
        emit({ status: "completed" });
        expect(completions).toBe(1);
        task.destroy();
    });

    it("completes once but never follows cancellation or a destroyed view", () => {
        const { engine, emit, listeners } = fixture();
        const task = createSpeechTask(engine);
        let calls = 0;
        task.speak(request, { onComplete: () => { calls++; } });
        emit({ status: "completed" }); emit({ status: "completed" });
        expect(calls).toBe(1);
        emit({ status: "speaking" });
        task.speak(request, { onComplete: () => { calls++; } });
        task.destroy(); emit({ status: "error" });
        expect(calls).toBe(1); expect(listeners.size).toBe(0);
    });
    it("replacing speech unsubscribes before stop can emit idle", () => {
        const { engine, emit } = fixture(); const task = createSpeechTask(engine);
        let previous = 0; let next = 0;
        task.speak(request, { onComplete: () => { previous++; } });
        engine.speak = () => {
            const listeners = new Set<(value: SpeechPlaybackState) => void>();
            return { getState: () => ({ status: "completed" }), pause(): void {}, resume(): void {}, stop(): void {},
                subscribe: listener => { listeners.add(listener); listener({ status: "completed" }); return () => listeners.delete(listener); } };
        };
        task.speak(request, { onComplete: () => { next++; } }); emit({ status: "completed" });
        expect(previous).toBe(0); expect(next).toBe(1); task.destroy();
    });
    it.each(["error", "unavailable"] as const)("falls back and preserves the workflow on %s", status => {
        const { engine, emit } = fixture(); const task = createSpeechTask(engine); const calls: string[] = [];
        task.speak(request, { onFallback: () => calls.push("fallback"), onComplete: () => calls.push("complete") });
        emit({ status }); emit({ status });
        expect(calls).toEqual(["fallback", "complete"]); task.destroy();
    });
    it("handles a missing or throwing engine and permits disposal from the fallback", () => {
        const { engine } = fixture(); let calls = 0;
        engine.getCapabilities = () => ({ available: false, pause: false, spelling: false });
        const task = createSpeechTask(engine);
        task.speak(request, { onFallback: () => task.destroy(), onComplete: () => { calls++; } });
        expect(calls).toBe(0);
        const another = createSpeechTask({ ...engine, getCapabilities: () => ({ available: true, pause: false, spelling: false }),
            speak: () => { throw new Error("provider failed"); } });
        another.speak(request, { onComplete: () => { calls++; } });
        expect(calls).toBe(1); another.destroy();
    });
});
