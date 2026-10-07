import { describe, expect, it } from "vitest";
import { createAudioSpeechResolver, type AudioSpeechRecording } from "../../packages/core/src/speech";

describe("createAudioSpeechResolver", () => {
    const signal = new AbortController().signal;
    const record = { text: "Café", language: "en-GB", src: "/coffee.mp3" };

    it("resolves synchronously using NFC, case-insensitive language tags and trimmed reading text", () => {
        const resolve = createAudioSpeechResolver([record]);
        expect(resolve({ text: " Cafe\u0301 ", language: "EN-gb" }, signal)).toEqual({ src: "/coffee.mp3" });
        expect(resolve({ text: "café", language: "en-GB" }, signal)).toBeNull();
        expect(resolve({ text: "Café", language: "en-US" }, signal)).toBeNull();
    });

    it("keeps spelling distinct, including recorded spaces", () => {
        const resolve = createAudioSpeechResolver([record, { text: " ", language: "en-GB", mode: "spell", src: "/space.mp3", spellWhitespaceText: "space" }]);
        expect(resolve({ text: "Café", language: "en-GB", mode: "spell" }, signal)).toBeNull();
        expect(resolve({ text: " ", language: "en-GB", mode: "spell", spellWhitespaceText: "space" }, signal)).toEqual({ src: "/space.mp3" });
        expect(resolve({ text: " ", language: "en-GB" }, signal)).toBeNull();
        expect(resolve({ text: " ", language: "en-GB", mode: "spell", spellWhitespaceText: "gap" }, signal)).toBeNull();
    });

    it("deduplicates identical entries but rejects ambiguous voices or pronunciations", () => {
        expect(createAudioSpeechResolver([record, record])({ ...record }, signal)).toEqual({ src: record.src });
        expect(() => createAudioSpeechResolver([record, { ...record, src: "/other-voice.mp3" }])).toThrow("audio-recording-conflict");
    });

    it("owns a stable snapshot and never resolves an aborted request", () => {
        const source = { ...record };
        const records = [source];
        const resolve = createAudioSpeechResolver(records);
        source.src = "/changed.mp3";
        records.length = 0;
        expect(resolve(record, signal)).toEqual({ src: record.src });
        const controller = new AbortController();
        controller.abort();
        expect(resolve(record, controller.signal)).toBeNull();
    });

    it("rejects malformed or oversized recording catalogs", () => {
        for (const invalid of [
            { ...record, text: " " }, { ...record, src: "" }, { ...record, language: "english" },
            { ...record, mode: "other" }, { ...record, text: "a".repeat(16001) }
        ]) expect(() => createAudioSpeechResolver([invalid as AudioSpeechRecording])).toThrow("audio-recording-invalid");
        expect(() => createAudioSpeechResolver(Array.from({ length: 10001 }, () => record))).toThrow("audio-catalog-too-large");
    });
});
