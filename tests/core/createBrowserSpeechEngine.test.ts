import { describe, expect, it, vi } from "vitest";
import {
    createBrowserSpeechEngine
} from "../../packages/core/src/speech";

interface FakeSynthesizer {
    readonly spoken: SpeechSynthesisUtterance[];
    readonly cancel: ReturnType<typeof vi.fn>;
    readonly synthesis: SpeechSynthesis;
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

    return {
        spoken,
        cancel,
        synthesis: {
            cancel,
            getVoices: () => [{
                lang: "uk-UA"
            } as SpeechSynthesisVoice],
            speak(utterance: SpeechSynthesisUtterance): void {
                spoken.push(utterance);
            }
        } as unknown as SpeechSynthesis
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

    it("spells Unicode letters and numbers without speaking punctuation or whitespace", () => {
        const fake = createFakeSynthesizer();
        const engine = createBrowserSpeechEngine({
            speechSynthesis: fake.synthesis,
            createUtterance: createFakeUtterance
        });

        engine.speak({
            segments: [{
                text: "A, \u4e2d 2.",
                language: "zh-Hans",
                mode: "spell"
            }]
        });

        complete(fake.spoken[0] as SpeechSynthesisUtterance);
        complete(fake.spoken[1] as SpeechSynthesisUtterance);

        expect(fake.spoken.map((utterance) => utterance.text)).toEqual([
            "A",
            "\u4e2d",
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
