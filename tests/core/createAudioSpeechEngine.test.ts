import { afterEach, describe, expect, it, vi } from "vitest";
import {
    createAudioSpeechEngine,
    createSpeechTask,
    type AudioSpeechEngineOptions,
    type SpeechAudioSource,
    type SpeechEngine,
    type SpeechSegment
} from "../../packages/core/src/speech";
import { SpeechToggleButton } from "../../packages/components/src";

class FakeAudio extends EventTarget {
    src = "";
    volume = 1;
    playbackRate = 1;
    preload = "none";
    loop = false;
    currentTime = 0;
    ended = false;
    error: MediaError | null = null;
    readonly played: { src: string; rate: number; volume: number }[] = [];
    readonly handlers = new Map<string, Set<EventListenerOrEventListenerObject>>();
    readonly play = vi.fn((): Promise<void> => {
        this.played.push({ src: this.src, rate: this.playbackRate, volume: this.volume });
        return Promise.resolve();
    });
    readonly pause = vi.fn();
    readonly load = vi.fn(() => {
        this.ended = false;
        this.error = null;
        this.currentTime = 0;
        this.playbackRate = 1;
    });
    readonly removeAttribute = vi.fn((name: string) => {
        if (name === "src") this.src = "";
    });

    override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null): void {
        if (callback) {
            const handlers = this.handlers.get(type) ?? new Set();
            handlers.add(callback);
            this.handlers.set(type, handlers);
        }
        super.addEventListener(type, callback);
    }

    override removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null): void {
        if (callback) this.handlers.get(type)?.delete(callback);
        super.removeEventListener(type, callback);
    }

    complete(): void {
        this.ended = true;
        this.dispatchEvent(new Event("ended"));
    }

    fail(): void {
        this.error = { code: 3 } as MediaError;
        this.dispatchEvent(new Event("error"));
    }

    element(): HTMLAudioElement { return this as unknown as HTMLAudioElement; }
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail; });
    return { promise, resolve, reject };
}

const engines: SpeechEngine[] = [];
const request = { segments: [{ text: "Hello", language: "en-GB" }] };

function setup(options: Partial<AudioSpeechEngineOptions> = {}) {
    const audio = new FakeAudio();
    const resolveSegment = vi.fn((segment: SpeechSegment) => ({ src: `/${segment.language}/${segment.text}.mp3` }));
    const createAudio = vi.fn(() => audio.element());
    const engine = createAudioSpeechEngine({ resolveSegment, createAudio, ...options });
    engines.push(engine);
    return { audio, engine, resolveSegment, createAudio };
}

afterEach(() => {
    engines.splice(0).forEach((engine) => engine.stop());
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
});

describe("createAudioSpeechEngine", () => {
    it("starts a synchronous source before returning, without a constructor-time audio probe", () => {
        const { engine, audio, createAudio } = setup();
        expect(audio.play).not.toHaveBeenCalled();
        expect(engine.getCapabilities()).toEqual({ available: true, pause: true, spelling: false });
        const playback = engine.speak(request);
        expect(audio.played).toEqual([{ src: "/en-GB/Hello.mp3", rate: 1, volume: 1 }]);
        expect(playback.getState()).toEqual({ status: "speaking" });
        engine.speak(request);
        expect(createAudio).toHaveBeenCalledTimes(1);
    });

    it("plays ordered recordings for each language using segment rates and one request volume", () => {
        const resolveSegment = vi.fn((segment: SpeechSegment) => segment.language === "uk-UA"
            ? [{ src: "/uk-1.mp3" }, { src: "/uk-2.mp3" }] : { src: "/en.mp3" });
        const { engine, audio } = setup({ resolveSegment });
        const segments = [{ text: " Native ", language: "uk-UA", rate: 0.75 }, { text: "Target", language: "en-GB" }];
        const playback = engine.speak({ segments, rate: 1.25, volume: 0.6 });
        segments[1]!.text = "Changed after speak";
        audio.complete();
        expect(resolveSegment).toHaveBeenCalledTimes(1);
        audio.complete();
        expect(resolveSegment.mock.calls[1]?.[0].text).toBe("Target");
        audio.complete();
        expect(audio.played).toEqual([
            { src: "/uk-1.mp3", rate: 0.75, volume: 0.6 },
            { src: "/uk-2.mp3", rate: 0.75, volume: 0.6 },
            { src: "/en.mp3", rate: 1.25, volume: 0.6 }
        ]);
        expect(playback.getState()).toEqual({ status: "completed" });
        expect(audio.src).toBe("");
        expect([...audio.handlers.values()].every((handlers) => handlers.size === 0)).toBe(true);
    });

    it("completes an empty request without resolving or playing anything", () => {
        const { engine, audio, resolveSegment } = setup();
        expect(engine.speak({ segments: [{ text: "  ", language: "en" }] }).getState().status).toBe("completed");
        expect(resolveSegment).not.toHaveBeenCalled();
        expect(audio.play).not.toHaveBeenCalled();
    });

    it("does not discard a dedicated spoken-space recording while spelling", () => {
        const { engine, audio, resolveSegment } = setup({ supportsSpelling: true });
        const playback = engine.speak({ segments: [{ text: " ", language: "en", mode: "spell", spellWhitespaceText: "space" }] });
        expect(resolveSegment.mock.calls[0]?.[0].text).toBe(" ");
        expect(audio.play).toHaveBeenCalledOnce();
        audio.complete();
        expect(playback.getState().status).toBe("completed");
    });

    it("resumes the same recording at the paused position without reloading it", () => {
        const { engine, audio, resolveSegment } = setup();
        const playback = engine.speak(request);
        audio.currentTime = 7;
        playback.pause();
        expect(playback.getState().status).toBe("paused");
        playback.resume();
        expect(audio.currentTime).toBe(7);
        expect(audio.load).toHaveBeenCalledTimes(1);
        expect(audio.play).toHaveBeenCalledTimes(2);
        expect(resolveSegment).toHaveBeenCalledTimes(1);
    });

    it("keeps asynchronously resolved sources paused until the user resumes", async () => {
        const source = deferred<SpeechAudioSource>();
        const { engine, audio } = setup({ resolveSegment: () => source.promise });
        const playback = engine.speak(request);
        playback.pause();
        source.resolve({ src: "/ready.mp3" });
        await Promise.resolve();
        expect(audio.play).not.toHaveBeenCalled();
        playback.resume();
        expect(audio.played[0]?.src).toBe("/ready.mp3");
    });

    it("aborts a pending resolver and ignores a late result after stop", async () => {
        const source = deferred<SpeechAudioSource>();
        let signal!: AbortSignal;
        const { engine, audio } = setup({ resolveSegment: (_segment, current) => { signal = current; return source.promise; } });
        const playback = engine.speak(request);
        playback.stop();
        expect(signal.aborted).toBe(true);
        source.resolve({ src: "/late.mp3" });
        await Promise.resolve();
        expect(audio.play).not.toHaveBeenCalled();
        expect(playback.getState()).toEqual({ status: "idle" });
    });

    it("replaces playback without letting a stale resolver overwrite the new source", async () => {
        const source = deferred<SpeechAudioSource>();
        const { engine, audio } = setup({ resolveSegment: (segment) => segment.text === "Hello"
            ? source.promise : { src: "/new.mp3" } });
        const first = engine.speak(request);
        const second = engine.speak({ segments: [{ text: "New", language: "uk-UA" }] });
        source.reject(new Error("Old fetch failed"));
        await Promise.resolve();
        expect(first.getState().status).toBe("idle");
        expect(second.getState().status).toBe("speaking");
        expect(audio.played.map((clip) => clip.src)).toEqual(["/new.mp3"]);
    });

    it("ignores detached handlers and queued ended events from a replaced recording", () => {
        const { engine, audio } = setup();
        engine.speak(request);
        const oldHandler = [...audio.handlers.get("ended")!][0] as EventListener;
        const current = engine.speak(request);
        audio.ended = true;
        oldHandler(new Event("ended"));
        expect(current.getState().status).toBe("speaking");
        audio.ended = false;
        audio.dispatchEvent(new Event("ended"));
        expect(current.getState().status).toBe("speaking");
        audio.complete();
        expect(current.getState().status).toBe("completed");
    });

    it("ignores a play promise interrupted by pause, including after a subsequent resume", async () => {
        const started = deferred<void>();
        const { engine, audio } = setup();
        audio.play.mockImplementationOnce(() => started.promise);
        const playback = engine.speak(request);
        playback.pause();
        playback.resume();
        started.reject(new DOMException("Paused", "AbortError"));
        await Promise.resolve();
        expect(playback.getState().status).toBe("speaking");
    });

    it("does not start the next clip when the preceding ended event arrives while paused", () => {
        const { engine, audio } = setup({ resolveSegment: () => [{ src: "/one.mp3" }, { src: "/two.mp3" }] });
        const playback = engine.speak(request);
        playback.pause();
        audio.complete();
        expect(audio.played).toHaveLength(1);
        playback.resume();
        expect(audio.played.map((clip) => clip.src)).toEqual(["/one.mp3", "/two.mp3"]);
    });

    it("handles an absent, throwing, or partial media implementation without breaking startup", () => {
        const resolveSegment = vi.fn(() => null);
        const factories = [null, () => { throw new Error("No Audio"); }, () => ({ play() {} } as HTMLAudioElement)];
        for (const createAudio of factories) {
            const engine = createAudioSpeechEngine({ createAudio, resolveSegment });
            expect(engine.getCapabilities()).toEqual({ available: false, pause: false, spelling: false });
            expect(engine.speak(request).getState()).toEqual({ status: "unavailable" });
        }
        vi.stubGlobal("Audio", undefined);
        expect(createAudioSpeechEngine({ resolveSegment }).getCapabilities().available).toBe(false);
        expect(resolveSegment).not.toHaveBeenCalled();
    });

    it.each([null, []] as SpeechAudioSource[])("reports a missing source without selecting another engine: %j", (source) => {
        const { engine, audio } = setup({ resolveSegment: () => source });
        expect(engine.speak(request).getState()).toEqual({ status: "unavailable", error: "audio-source-missing" });
        expect(audio.play).not.toHaveBeenCalled();
    });

    it("rejects invalid source URLs before playing part of the segment", () => {
        const { engine, audio } = setup({ resolveSegment: () => [{ src: "/good.mp3" }, { src: " " }] });
        expect(engine.speak(request).getState()).toEqual({ status: "error", error: "audio-source-invalid" });
        expect(audio.play).not.toHaveBeenCalled();
    });

    it("handles resolver failures without leaking its exception text", async () => {
        const { engine } = setup({ resolveSegment: () => { throw new Error("Secret URL"); } });
        expect(engine.speak(request).getState()).toEqual({ status: "error", error: "audio-resolve-failed" });
        const asynchronous = setup({ resolveSegment: () => Promise.reject(new Error("Secret URL")) });
        const playback = asynchronous.engine.speak(request);
        await Promise.resolve();
        expect(playback.getState()).toEqual({ status: "error", error: "audio-resolve-failed" });
    });

    it.each([
        ["NotAllowedError", "audio-playback-blocked"],
        ["NotSupportedError", "audio-format-unsupported"],
        ["UnknownError", "audio-playback-failed"]
    ])("reports rejected playback as a localizable code for %s", async (name, code) => {
        const { engine, audio } = setup();
        audio.play.mockRejectedValueOnce(new DOMException("Browser rejected audio", name));
        const playback = engine.speak(request);
        await Promise.resolve();
        expect(playback.getState()).toEqual({ status: "error", error: code });
        expect(audio.src).toBe("");
    });

    it("reports synchronous media startup failures and asynchronous media errors", () => {
        const { engine, audio } = setup();
        audio.play.mockImplementationOnce(() => { throw new DOMException("Blocked", "NotAllowedError"); });
        expect(engine.speak(request).getState().error).toBe("audio-playback-blocked");
        const playback = engine.speak(request);
        audio.fail();
        expect(playback.getState()).toEqual({ status: "error", error: "audio-media-failed" });
    });

    it("times out resolution and ignores its eventual completion", async () => {
        vi.useFakeTimers();
        const source = deferred<SpeechAudioSource>();
        const { engine, audio } = setup({ startTimeoutMs: 100, resolveSegment: () => source.promise });
        const playback = engine.speak(request);
        await vi.advanceTimersByTimeAsync(100);
        expect(playback.getState()).toEqual({ status: "error", error: "audio-resolve-timeout" });
        source.resolve({ src: "/too-late.mp3" });
        await Promise.resolve();
        expect(audio.play).not.toHaveBeenCalled();
    });

    it("times out startup or buffering without limiting the duration of playing audio", async () => {
        vi.useFakeTimers();
        const { engine, audio } = setup({ startTimeoutMs: 100 });
        audio.play.mockImplementationOnce(() => new Promise(() => {}));
        const failed = engine.speak(request);
        await vi.advanceTimersByTimeAsync(100);
        expect(failed.getState().error).toBe("audio-playback-timeout");
        const playing = engine.speak(request);
        await vi.advanceTimersByTimeAsync(1000);
        expect(playing.getState().status).toBe("speaking");
        audio.dispatchEvent(new Event("waiting"));
        await vi.advanceTimersByTimeAsync(100);
        expect(playing.getState().error).toBe("audio-playback-timeout");
    });

    it("supports older play() implementations without a Promise through the playing event", async () => {
        vi.useFakeTimers();
        const { engine, audio } = setup({ startTimeoutMs: 100 });
        audio.play.mockImplementationOnce(() => undefined as unknown as Promise<void>);
        const playback = engine.speak(request);
        audio.dispatchEvent(new Event("playing"));
        await vi.advanceTimersByTimeAsync(200);
        expect(playback.getState().status).toBe("speaking");
        audio.complete();
        expect(playback.getState().status).toBe("completed");
    });

    it("suspends startup timeouts on pause and restarts the wait on resume", async () => {
        vi.useFakeTimers();
        const { engine } = setup({ startTimeoutMs: 100, resolveSegment: () => new Promise(() => {}) });
        const playback = engine.speak(request);
        playback.pause();
        await vi.advanceTimersByTimeAsync(1000);
        expect(playback.getState().status).toBe("paused");
        playback.resume();
        await vi.advanceTimersByTimeAsync(100);
        expect(playback.getState().error).toBe("audio-resolve-timeout");
    });

    it("enables spelling only explicitly and passes the complete recipe to the resolver", () => {
        const segment = { text: "A, B.", language: "en-GB", mode: "spell" as const, spellWhitespaceText: "space" };
        const disabled = setup();
        expect(disabled.engine.speak({ segments: [segment] }).getState()).toEqual({
            status: "unavailable", error: "audio-spelling-unavailable"
        });
        expect(disabled.resolveSegment).not.toHaveBeenCalled();
        const enabled = setup({ supportsSpelling: true });
        expect(enabled.engine.getCapabilities().spelling).toBe(true);
        enabled.engine.speak({ segments: [segment] });
        expect(enabled.resolveSegment.mock.calls[0]?.[0]).toEqual(segment);
    });

    it("bounds rate/volume and handles non-finite settings", () => {
        const { engine, audio } = setup();
        engine.speak({ rate: 100, volume: -1, segments: request.segments });
        expect(audio.played[0]).toMatchObject({ rate: 4, volume: 0 });
        engine.speak({ rate: NaN, volume: Infinity, segments: [{ ...request.segments[0]!, rate: 0.01 }] });
        expect(audio.played[1]).toMatchObject({ rate: 0.25, volume: 1 });
    });

    it("preserves owned speech follow-ups: complete and failure settle, cancellation does not", () => {
        const { engine, audio } = setup();
        const task = createSpeechTask(engine);
        const complete = vi.fn();
        const fallback = vi.fn();
        task.speak(request, { onComplete: complete, onFallback: fallback });
        task.cancel();
        audio.complete();
        expect(complete).not.toHaveBeenCalled();
        task.speak(request, { onComplete: complete, onFallback: fallback });
        audio.complete();
        expect(complete).toHaveBeenCalledTimes(1);
        task.speak(request, { onComplete: complete, onFallback: fallback });
        audio.fail();
        expect(fallback).toHaveBeenCalledTimes(1);
        expect(complete).toHaveBeenCalledTimes(2);
        task.destroy();
    });

    it("works with the existing single-button speech controls without a second UI contract", () => {
        const { engine, audio } = setup();
        const button = SpeechToggleButton({ engine, request, startText: "Start", pauseText: "Pause", resumeText: "Resume" });
        document.body.append(button.element);
        button.element.click();
        expect(button.element.textContent).toBe("Pause");
        button.element.click();
        expect(button.element.textContent).toBe("Resume");
        button.element.click();
        expect(button.element.textContent).toBe("Pause");
        audio.complete();
        expect(button.element.textContent).toBe("Start");
        button.destroy();
    });

    it("lets a later request started by a stop listener own the shared audio element", () => {
        const { engine, audio } = setup();
        const first = engine.speak(request);
        first.subscribe((state) => {
            if (state.status === "idle") engine.speak({ segments: [{ text: "Latest", language: "en" }] });
        });
        const superseded = engine.speak({ segments: [{ text: "Middle", language: "en" }] });
        expect(superseded.getState().status).toBe("idle");
        expect(audio.played.map((clip) => clip.src)).toEqual(["/en-GB/Hello.mp3", "/en/Latest.mp3"]);
    });
});
