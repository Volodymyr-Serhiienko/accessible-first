import { afterEach, describe, expect, it, vi } from "vitest";
import { createAudioSpellingResolver, type AudioSpeechRecording } from "../../packages/core/src/speech";

describe("createAudioSpellingResolver", () => {
    const signal = new AbortController().signal;
    const letter = (text: string, language = "de-DE", src = `/${text}.mp3`): AudioSpeechRecording => ({
        text, language, mode: "spell", src
    });
    const space: AudioSpeechRecording = { ...letter(" "), src: "/space.mp3", spellWhitespaceText: "Leerzeichen" };
    afterEach(() => vi.unstubAllGlobals());

    it("assembles reused clips synchronously, preserving accents, spaces and character order", () => {
        const resolve = createAudioSpellingResolver([letter("A"), letter("Ä"), space]);
        expect(resolve({ text: "a, A\u0308!\ta.", language: "DE-de", mode: "spell", spellWhitespaceText: "Leerzeichen" }, signal))
            .toEqual([{ src: "/A.mp3" }, { src: "/space.mp3" }, { src: "/Ä.mp3" }, { src: "/space.mp3" }, { src: "/A.mp3" }]);
    });

    it("never skips an unknown letter, switches languages, or substitutes ordinary reading", () => {
        const resolve = createAudioSpellingResolver([letter("A"), space, { text: "AB", language: "de-DE", src: "/word.mp3" }]);
        expect(resolve({ text: "AB", language: "de-DE", mode: "spell" }, signal)).toBeNull();
        expect(resolve({ text: "A", language: "en-GB", mode: "spell" }, signal)).toBeNull();
        expect(resolve({ text: "A", language: "de-DE" }, signal)).toBeNull();
        expect(resolve({ text: "A", language: "de-DE", mode: "spell" }, signal)).toEqual([{ src: "/A.mp3" }]);
    });

    it("uses language-sensitive casing including German sharp S and Turkish dotted I", () => {
        const resolve = createAudioSpellingResolver([letter("ß"), letter("İ", "tr-TR")]);
        expect(resolve({ text: "ẞß", language: "de-DE", mode: "spell" }, signal)).toEqual([{ src: "/ß.mp3" }, { src: "/ß.mp3" }]);
        expect(resolve({ text: "i", language: "tr-TR", mode: "spell" }, signal)).toEqual([{ src: "/İ.mp3" }]);
        expect(resolve({ text: "I", language: "tr-TR", mode: "spell" }, signal)).toBeNull();
    });

    it("supports recorded digits and explicitly preselected non-alphabetic readings", () => {
        const resolve = createAudioSpellingResolver([letter("行", "zh-CN"), letter("2", "zh-CN")]);
        expect(resolve({ text: "行2行。", language: "zh-CN", mode: "spell" }, signal))
            .toEqual([{ src: "/行.mp3" }, { src: "/2.mp3" }, { src: "/行.mp3" }]);
        expect(resolve({ text: "书", language: "zh-CN", mode: "spell" }, signal)).toBeNull();
    });

    it("requires a matching recorded space name only when space pronunciation is requested", () => {
        const resolve = createAudioSpellingResolver([letter("A"), space]);
        expect(resolve({ text: " A\nA ", language: "de-DE", mode: "spell" }, signal)).toEqual([{ src: "/A.mp3" }, { src: "/A.mp3" }]);
        expect(resolve({ text: "\r\n", language: "de-DE", mode: "spell", spellWhitespaceText: "Leerzeichen" }, signal))
            .toEqual([{ src: "/space.mp3" }]);
        expect(resolve({ text: "A A", language: "de-DE", mode: "spell", spellWhitespaceText: "gap" }, signal)).toBeNull();
    });

    it("rejects ambiguous casing, multi-grapheme and malformed entries", () => {
        expect(() => createAudioSpellingResolver([letter("A"), letter("a")])).toThrow("audio-spelling-recording-conflict");
        for (const text of ["AB", "!", "😀"]) expect(() => createAudioSpellingResolver([letter(text)]))
            .toThrow("audio-spelling-recording-invalid");
        expect(() => createAudioSpellingResolver([{ ...letter("A"), src: "" }])).toThrow("audio-recording-invalid");
    });

    it("owns an immutable snapshot and rejects cancellation or empty/oversized output", () => {
        const record = { ...letter("A") };
        const records = [record];
        const resolve = createAudioSpellingResolver(records);
        record.src = "/changed.mp3";
        records.length = 0;
        const request = { text: "A", language: "de-DE", mode: "spell" as const };
        expect(resolve(request, signal)).toEqual([{ src: "/A.mp3" }]);
        const aborted = new AbortController();
        aborted.abort();
        expect(resolve(request, aborted.signal)).toBeNull();
        for (const text of ["", "!?😀", "A".repeat(16001)]) expect(resolve({ ...request, text }, signal)).toBeNull();
    });

    it("fails closed without Intl.Segmenter, without crashing or splitting UTF-16 units", () => {
        vi.stubGlobal("Intl", { Segmenter: undefined });
        expect(createAudioSpellingResolver([letter("A")])({ text: "A", language: "de-DE", mode: "spell" }, signal)).toBeNull();
    });

    it("does not crash with a broken native segmenter", () => {
        vi.stubGlobal("Intl", { Segmenter: class { constructor() { throw new Error("unavailable"); } } });
        expect(createAudioSpellingResolver([letter("A")])({ text: "A", language: "de-DE", mode: "spell" }, signal)).toBeNull();
    });

    it("keeps supplementary-plane letters and combining-mark clusters intact", () => {
        const resolve = createAudioSpellingResolver([letter("𐐀", "en-US"), letter("क़", "hi-IN")]);
        expect(resolve({ text: "𐐨𐐀", language: "en-US", mode: "spell" }, signal)).toEqual([{ src: "/𐐀.mp3" }, { src: "/𐐀.mp3" }]);
        expect(resolve({ text: "क़", language: "hi-IN", mode: "spell" }, signal)).toEqual([{ src: "/क़.mp3" }]);
    });
});
