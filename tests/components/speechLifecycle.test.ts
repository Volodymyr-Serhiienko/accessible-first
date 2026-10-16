import { afterEach, describe, expect, it, vi } from "vitest";
import { SpeechButton, SpeechControls, SpeechToggleButton } from "../../packages/components/src/speech";
import * as buttonModule from "../../packages/components/src/button";
import * as statusModule from "../../packages/components/src/status-message";
import type { SpeechEngine, SpeechPlayback, SpeechPlaybackListener, SpeechPlaybackState, SpeechRequest } from "../../packages/core/src/speech";

const request: SpeechRequest = { segments: [{ text: "Hello", language: "en" }] };
const nextRequest: SpeechRequest = { segments: [{ text: "Next", language: "en" }] };
const cleanups: Array<() => void> = [];
const kinds = ["button", "toggle", "controls"] as const;

function playbackProbe(initial: SpeechPlaybackState["status"] = "speaking", options: { failCleanup?: boolean; onCleanup?: () => void } = {}) {
    const listeners = new Set<SpeechPlaybackListener>();
    const retired: SpeechPlaybackListener[] = [];
    let state: SpeechPlaybackState = { status: initial };
    const emit = (status: SpeechPlaybackState["status"], late = false): void => {
        state = { status };
        (late ? retired : [...listeners]).forEach(listener => listener(state));
    };
    const unsubscribe = vi.fn(() => {
        listeners.clear(); options.onCleanup?.();
        if (options.failCleanup) throw new Error("unsubscribe");
    });
    const playback: SpeechPlayback = {
        getState: () => state,
        pause: vi.fn(() => emit("paused")), resume: vi.fn(() => emit("speaking")), stop: vi.fn(() => emit("idle")),
        subscribe: vi.fn(listener => { listeners.add(listener); retired.push(listener); listener(state); return unsubscribe; })
    };
    return { playback, emit, unsubscribe, listeners };
}

function engineProbe(sources: ReturnType<typeof playbackProbe>[], pause = true) {
    let index = 0;
    const engine: SpeechEngine = {
        id: "fixture", getCapabilities: vi.fn(() => ({ available: true, pause, spelling: true })),
        speak: vi.fn(() => sources[index++]!.playback), stop: vi.fn()
    };
    return engine;
}

function compose(kind: typeof kinds[number], engine: SpeechEngine, onUnavailable = vi.fn(), onFailure = vi.fn()) {
    const view = kind === "button" ? SpeechButton({ engine, request, label: "Listen", onUnavailable, onFailure })
        : kind === "toggle" ? SpeechToggleButton({ engine, request, startText: "Listen", pauseText: "Pause", resumeText: "Resume", onUnavailable, onFailure })
            : SpeechControls({ engine, request, label: "Reader", startText: "Listen", pauseText: "Pause", resumeText: "Resume", stopText: "Stop",
                pausedText: "Paused", stoppedText: "Stopped", unavailableText: "Unavailable", failedText: "Failed" });
    cleanups.push(view.destroy);
    return view;
}

afterEach(() => {
    cleanups.splice(0).reverse().forEach(cleanup => { try { cleanup(); } catch { /* Expected failure probes. */ } });
    document.body.replaceChildren(); vi.restoreAllMocks();
});

describe("Speech composition lifetime", () => {
    it.each(kinds)("makes all late %s actions inert", kind => {
        const source = playbackProbe(); const engine = engineProbe([source]); const view = compose(kind, engine);
        view.play(); view.destroy(); const markup = view.element.outerHTML;
        view.play();
        if ("pause" in view) { view.pause(); view.resume(); view.setRequest(nextRequest); }
        if ("stop" in view) view.stop();
        source.emit("error", true); view.destroy();
        expect(view.isDestroyed()).toBe(true); expect(view.element.outerHTML).toBe(markup);
        expect(engine.speak).toHaveBeenCalledOnce(); expect(source.unsubscribe).toHaveBeenCalledOnce();
        expect(engine.stop).not.toHaveBeenCalled();
        expect(source.playback.stop).toHaveBeenCalledTimes(kind === "button" ? 0 : 1);
    });

    it.each(kinds)("ignores stale %s playback callbacks after replacement", kind => {
        const first = playbackProbe(); const second = playbackProbe(); const failed = vi.fn();
        const view = compose(kind, engineProbe([first, second]), vi.fn(), failed);
        view.play(); view.play(); const markup = view.element.outerHTML;
        first.emit("error", true); first.emit("paused", true);
        expect(view.element.outerHTML).toBe(markup); expect(failed).not.toHaveBeenCalled();
        expect(first.unsubscribe).toHaveBeenCalledOnce();
    });

    it.each(kinds)("unsubscribes %s after synchronous completion", kind => {
        const source = playbackProbe("completed"); const view = compose(kind, engineProbe([source]));
        view.play(); expect(source.unsubscribe).toHaveBeenCalledOnce(); expect(source.listeners.size).toBe(0);
        view.destroy(); expect(source.unsubscribe).toHaveBeenCalledOnce(); expect(source.playback.stop).not.toHaveBeenCalled();
    });

    it.each(kinds)("finishes %s teardown when unsubscribe throws", kind => {
        const source = playbackProbe("speaking", { failCleanup: true }); const view = compose(kind, engineProbe([source]));
        view.play(); expect(() => view.destroy()).toThrow("unsubscribe");
        expect(view.isDestroyed()).toBe(true);
        if ("button" in view) expect(view.button.isDestroyed()).toBe(true);
        else expect([view.startButton, view.pauseButton, view.stopButton].every(button => button.isDestroyed())).toBe(true);
        expect(source.playback.stop).toHaveBeenCalledTimes(kind === "button" ? 0 : 1);
        expect(() => view.destroy()).not.toThrow();
    });

    it.each(kinds)("still starts a new %s request after old cleanup fails", kind => {
        const first = playbackProbe("speaking", { failCleanup: true }); const second = playbackProbe();
        const engine = engineProbe([first, second]); const view = compose(kind, engine);
        view.play(); expect(() => view.play()).toThrow("unsubscribe");
        expect(engine.speak).toHaveBeenCalledTimes(2); expect(second.playback.subscribe).toHaveBeenCalledOnce();
    });

    it.each(kinds)("does not replace a newer %s playback started by engine.speak", kind => {
        const obsolete = playbackProbe(); const latest = playbackProbe(); const engine = engineProbe([]);
        const view = compose(kind, engine); let nested = false;
        vi.mocked(engine.speak).mockImplementation(() => { if (!nested) { nested = true; view.play(); return obsolete.playback; } return latest.playback; });
        view.play();
        expect(obsolete.playback.subscribe).not.toHaveBeenCalled(); expect(latest.playback.subscribe).toHaveBeenCalledOnce();
        expect(obsolete.playback.stop).toHaveBeenCalledTimes(kind === "button" ? 0 : 1);
        expect(latest.playback.stop).not.toHaveBeenCalled();
    });

    it.each(kinds)("releases the disposer returned after %s destruction during subscribe", kind => {
        const source = playbackProbe(); const view = compose(kind, engineProbe([source]));
        const subscribe = vi.mocked(source.playback.subscribe).getMockImplementation()!;
        vi.mocked(source.playback.subscribe).mockImplementation(listener => { const unsubscribe = subscribe(listener); view.destroy(); return unsubscribe; });
        view.play(); expect(source.unsubscribe).toHaveBeenCalledOnce(); expect(view.isDestroyed()).toBe(true);
        expect(source.playback.stop).toHaveBeenCalledTimes(kind === "button" ? 0 : 1);
    });

    it.each(kinds)("rejects retained %s events from a failed provider subscription", kind => {
        const source = playbackProbe(); const next = playbackProbe(); const failure = vi.fn();
        const view = compose(kind, engineProbe([source, next]), vi.fn(), failure);
        const subscribe = vi.mocked(source.playback.subscribe).getMockImplementation()!;
        vi.mocked(source.playback.subscribe).mockImplementation(listener => { subscribe(listener); throw new Error("subscribe"); });
        expect(() => view.play()).toThrow("subscribe"); view.play(); const markup = view.element.outerHTML;
        source.emit("error", true); expect(view.element.outerHTML).toBe(markup);
        if (kind !== "controls") expect(failure).toHaveBeenCalledOnce();
    });

    it.each(["button", "toggle"] as const)("keeps a newer %s request from a synchronous unavailable callback", kind => {
        const first = playbackProbe("unavailable"); const second = playbackProbe(); const engine = engineProbe([first, second]);
        let view: ReturnType<typeof compose>;
        view = compose(kind, engine, vi.fn(() => view.play())); view.play();
        expect(first.unsubscribe).toHaveBeenCalledOnce(); expect(second.unsubscribe).not.toHaveBeenCalled();
        view.destroy(); expect(second.unsubscribe).toHaveBeenCalledOnce();
    });

    it.each(["button", "toggle"] as const)("releases %s subscription before a throwing feedback callback", kind => {
        const source = playbackProbe("error"); const failure = vi.fn(() => { throw new Error("feedback"); });
        const view = compose(kind, engineProbe([source]), vi.fn(), failure);
        expect(() => view.play()).toThrow("feedback");
        expect(source.unsubscribe).toHaveBeenCalledOnce(); expect(failure).toHaveBeenCalledOnce();
        source.emit("error", true); expect(failure).toHaveBeenCalledOnce();
    });

    it("does not let an obsolete pause action affect a newer request", () => {
        const first = playbackProbe(); const second = playbackProbe(); const engine = engineProbe([first, second]);
        const view = SpeechToggleButton({ engine, request, startText: "Listen", pauseText: "Pause", resumeText: "Resume" }); cleanups.push(view.destroy);
        view.play(); let nested = false;
        vi.mocked(engine.getCapabilities).mockImplementation(() => { if (!nested) { nested = true; view.play(); } return { available: true, pause: true, spelling: true }; });
        view.pause(); expect(second.playback.pause).not.toHaveBeenCalled(); expect(view.element.textContent).toBe("Pause");
    });

    it("keeps the newer state requested by a capability resolver", () => {
        const first = playbackProbe(); const second = playbackProbe("paused"); const engine = engineProbe([first, second]);
        const view = SpeechToggleButton({ engine, request, startText: "Listen", pauseText: "Pause", resumeText: "Resume" }); cleanups.push(view.destroy);
        let nested = false;
        vi.mocked(engine.getCapabilities).mockImplementation(() => { if (!nested) { nested = true; view.play(); } return { available: true, pause: true, spelling: true }; });
        view.play(); expect(view.element.textContent).toBe("Resume");
    });

    it("does not expose a nonfunctional pause action for a nonpausable engine", () => {
        const first = playbackProbe(); const second = playbackProbe(); const engine = engineProbe([first, second], false);
        const view = SpeechToggleButton({ engine, request, startText: "Listen", pauseText: "Pause", resumeText: "Resume" }); cleanups.push(view.destroy);
        view.element.click(); expect(view.element.textContent).toBe("Listen");
        view.element.click(); expect(engine.speak).toHaveBeenCalledTimes(2); expect(first.playback.pause).not.toHaveBeenCalled();
    });

    it("keeps stop usable but pause unavailable on a nonpausable engine", () => {
        const source = playbackProbe(); const view = compose("controls", engineProbe([source], false));
        if (!("pauseButton" in view)) throw new Error("Expected controls");
        view.play(); expect(view.pauseButton.element.disabled).toBe(true); expect(view.stopButton.element.disabled).toBe(false);
    });

    it("returns only disabled-action focus to start after completion", () => {
        const source = playbackProbe(); const view = compose("controls", engineProbe([source]));
        if (!("startButton" in view)) throw new Error("Expected controls");
        document.body.append(view.element);
        vi.spyOn(view.startButton.element, "getClientRects").mockReturnValue([new DOMRect(0, 0, 100, 44)] as unknown as DOMRectList);
        view.play(); view.pauseButton.element.focus(); source.emit("completed");
        expect(document.activeElement).toBe(view.startButton.element);
    });

    it("preserves external focus when playback ends", () => {
        const source = playbackProbe(); const view = compose("controls", engineProbe([source]));
        const input = document.createElement("input"); document.body.append(view.element, input);
        view.play(); input.focus(); source.emit("completed"); expect(document.activeElement).toBe(input);
    });

    it("does not show an old pause message after pause starts newer playback", () => {
        const first = playbackProbe(); const next = playbackProbe(); const engine = engineProbe([first, next]);
        const view = compose("controls", engine); if (!("statusMessage" in view)) throw new Error("Expected controls");
        view.play(); vi.mocked(first.playback.pause).mockImplementation(() => view.play()); view.pause();
        expect(view.statusMessage.element.hidden).toBe(true); expect(view.pauseButton.element.textContent).toBe("Pause");
    });

    it("rejects failure text resolved after it started a newer request", () => {
        const first = playbackProbe(); const next = playbackProbe(); const engine = engineProbe([first, next]);
        const view = SpeechControls({ engine, request, label: "Reader", startText: "Listen", pauseText: "Pause", resumeText: "Resume", stopText: "Stop",
            get failedText() { view.play(); return "Obsolete failure"; } }); cleanups.push(view.destroy);
        view.play(); first.emit("error");
        expect(view.statusMessage.element.hidden).toBe(true); expect(view.pauseButton.element.disabled).toBe(false);
    });

    it("keeps newer playback controls when disposing old custom button content", () => {
        const first = playbackProbe(); const next = playbackProbe("paused"); const engine = engineProbe([first, next]);
        const view = compose("controls", engine); if (!("pauseButton" in view)) throw new Error("Expected controls");
        const element = document.createElement("span"); element.textContent = "Custom pause";
        view.pauseButton.update({ children: [{ element, destroy: () => view.play() }] });
        view.play(); expect(view.pauseButton.element.textContent).toBe("Resume"); expect(view.stopButton.element.disabled).toBe(false);
    });

    it("leaves all buttons and status disposed after partial controls construction fails", () => {
        const buttons = vi.spyOn(buttonModule, "Button"); const statuses = vi.spyOn(statusModule, "StatusMessage");
        expect(() => SpeechControls({ engine: engineProbe([]), request, get label(): string { throw new Error("label"); },
            startText: "Listen", pauseText: "Pause", resumeText: "Resume", stopText: "Stop" })).toThrow("label");
        expect(buttons.mock.results).toHaveLength(3);
        expect(buttons.mock.results.every(result => result.type === "return" && result.value.isDestroyed())).toBe(true);
        const status = statuses.mock.results[0]!.value;
        const markup = status.element.outerHTML;
        status.update({ text: "late" }); expect(status.element.outerHTML).toBe(markup);
    });

    it.each(kinds)("reports a thrown %s provider failure and keeps the controller recoverable", kind => {
        const source = playbackProbe(); const engine = engineProbe([source]); const failed = vi.fn();
        const view = compose(kind, engine, vi.fn(), failed); vi.mocked(engine.speak).mockImplementationOnce(() => { throw new Error("provider"); });
        expect(() => view.play()).toThrow("provider");
        if (kind !== "controls") expect(failed).toHaveBeenCalledOnce();
        else if ("statusMessage" in view) expect(view.statusMessage.getText()).toBe("Failed");
        view.play(); expect(source.playback.subscribe).toHaveBeenCalledOnce();
    });
});
