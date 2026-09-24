import { describe, expect, it, vi } from "vitest";
import {
    createBrowserSpeechEngine
} from "../../packages/core/src/speech";

interface FakeSynthesizer {
    readonly spoken: SpeechSynthesisUtterance[];
    readonly cancel: ReturnType<typeof vi.fn>;
    readonly getVoices: ReturnType<typeof vi.fn>;
    readonly synthesis: SpeechSynthesis;
    setVoices(voices: readonly SpeechSynthesisVoice[]): void;
}

function createFakeUtterance(text: string): SpeechSynthesisUtterance {
    return {
        text,
        lang: "",
        rate: 1,
        volume: 1,
        voice: null,
        onend: null,
        onerror: null
    } as unknown as SpeechSynthesisUtterance;
}

function createFakeSynthesizer(): FakeSynthesizer {
    const spoken: SpeechSynthesisUtterance[] = [];
    const cancel = vi.fn();
    let voices: readonly SpeechSynthesisVoice[] = [{
        lang: "uk-UA"
    } as SpeechSynthesisVoice];
    const getVoices = vi.fn(() => voices);
    const voiceChangeListeners = new Set<EventListener>();

    function setVoices(nextVoices: readonly SpeechSynthesisVoice[]): void {
        voices = nextVoices;
        voiceChangeListeners.forEach((listener) => {
            listener(new Event("voiceschanged"));
        });
    }

    return {
        spoken,
        cancel,
        getVoices,
        synthesis: {
            cancel,
            getVoices,
            addEventListener(
                type: string,
                listener: EventListenerOrEventListenerObject | null
            ): void {
                if (type === "voiceschanged" && typeof listener === "function") {
                    voiceChangeListeners.add(listener);
                }
            },
            speak(utterance: SpeechSynthesisUtterance): void {
                spoken.push(utterance);
            }
        } as unknown as SpeechSynthesis,
        setVoices
    };
}

function complete(utterance: SpeechSynthesisUtterance): void {
    utterance.onend?.call(
        utterance,
        new Event("end") as SpeechSynthesisEvent
    );
}

describe("createBrowserSpeechEngine", () => {
    it("reads ordered multilingual segments with their individual rates", () => {
        const fake = createFakeSynthesizer();
        const engine = createBrowserSpeechEngine({
            speechSynthesis: fake.synthesis,
            createUtterance: createFakeUtterance
        });
        const playback = engine.speak({
            rate: 0.9,
            volume: 0.75,
            segments: [
                { text: "Privit", language: "uk-UA", rate: 0.7 },
                { text: "Hello", language: "en-US" }
            ]
        });

        expect(fake.spoken).toHaveLength(1);
        expect(fake.spoken[0]).toMatchObject({
            text: "Privit",
            lang: "uk-UA",
            rate: 0.7,
            volume: 0.75
        });

        complete(fake.spoken[0] as SpeechSynthesisUtterance);

        expect(fake.spoken[1]).toMatchObject({
            text: "Hello",
            lang: "en-US",
            rate: 0.9,
            volume: 0.75
        });

        complete(fake.spoken[1] as SpeechSynthesisUtterance);

        expect(playback.getState()).toEqual({ status: "completed" });
    });

    it("caches preferred voices until the browser reports that voices changed", () => {
        const fake = createFakeSynthesizer();
        const firstVoice = {
            lang: "en-US",
            name: "First English voice"
        } as SpeechSynthesisVoice;
        const updatedVoice = {
            lang: "en-US",
            name: "Updated English voice"
        } as SpeechSynthesisVoice;
        const engine = createBrowserSpeechEngine({
            speechSynthesis: fake.synthesis,
            createUtterance: createFakeUtterance
        });

        fake.setVoices([firstVoice]);
        engine.speak({
            segments: [
                { text: "One", language: "en-US" },
                { text: "Two", language: "en-US" }
            ]
        });

        expect(fake.spoken[0]?.voice).toBe(firstVoice);
        expect(fake.getVoices).toHaveBeenCalledTimes(1);

        complete(fake.spoken[0] as SpeechSynthesisUtterance);

        expect(fake.spoken[1]?.voice).toBe(firstVoice);
        expect(fake.getVoices).toHaveBeenCalledTimes(1);

        fake.setVoices([updatedVoice]);
        engine.speak({
            segments: [{ text: "Three", language: "en-US" }]
        });

        expect(fake.spoken[2]?.voice).toBe(updatedVoice);
        expect(fake.getVoices).toHaveBeenCalledTimes(2);
    });

    it("spells Unicode letters and numbers, with optional spoken whitespace and no punctuation", () => {
        const fake = createFakeSynthesizer();
        const engine = createBrowserSpeechEngine({
            speechSynthesis: fake.synthesis,
            createUtterance: createFakeUtterance
        });

        engine.speak({
            segments: [{
                text: "A, \u4e2d 2.",
                language: "zh-Hans",
                mode: "spell",
                spellWhitespaceText: "\u7a7a\u683c"
            }]
        });

        complete(fake.spoken[0] as SpeechSynthesisUtterance);
        complete(fake.spoken[1] as SpeechSynthesisUtterance);
        complete(fake.spoken[2] as SpeechSynthesisUtterance);
        complete(fake.spoken[3] as SpeechSynthesisUtterance);

        expect(fake.spoken.map((utterance) => utterance.text)).toEqual([
            "A",
            "\u7a7a\u683c",
            "\u4e2d",
            "\u7a7a\u683c",
            "2"
        ]);
    });

    it("keeps stale completion events from changing stopped playback", () => {
        const fake = createFakeSynthesizer();
        const engine = createBrowserSpeechEngine({
            speechSynthesis: fake.synthesis,
            createUtterance: createFakeUtterance
        });
        const playback = engine.speak({
            segments: [{ text: "One", language: "en" }]
        });
        const firstUtterance = fake.spoken[0] as SpeechSynthesisUtterance;

        playback.stop();
        complete(firstUtterance);

        expect(playback.getState()).toEqual({ status: "idle" });
        expect(fake.cancel).toHaveBeenCalledTimes(1);
    });

    it("restarts the current segment after pause because browser resume is not reliable", () => {
        const fake = createFakeSynthesizer();
        const engine = createBrowserSpeechEngine({
            speechSynthesis: fake.synthesis,
            createUtterance: createFakeUtterance
        });
        const playback = engine.speak({
            segments: [{ text: "One", language: "en" }]
        });

        playback.pause();
        playback.resume();

        expect(playback.getState()).toEqual({ status: "speaking" });
        expect(fake.spoken.map((utterance) => utterance.text)).toEqual([
            "One",
            "One"
        ]);
    });

    it("reports unavailable playback and stops a preceding request before a new one", () => {
        const unavailable = createBrowserSpeechEngine({
            speechSynthesis: null,
            createUtterance: null
        });

        expect(unavailable.getCapabilities()).toEqual({
            available: false,
            pause: false,
            spelling: false
        });
        expect(unavailable.speak({ segments: [] }).getState()).toEqual({
            status: "unavailable"
        });

        const fake = createFakeSynthesizer();
        const engine = createBrowserSpeechEngine({
            speechSynthesis: fake.synthesis,
            createUtterance: createFakeUtterance
        });
        const first = engine.speak({
            segments: [{ text: "First", language: "en" }]
        });

        engine.speak({
            segments: [{ text: "Second", language: "en" }]
        });

        expect(first.getState()).toEqual({ status: "idle" });
        expect(fake.cancel).toHaveBeenCalledTimes(1);
    });
});
