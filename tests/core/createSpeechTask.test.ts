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
