import type { SpeechAudioClip, SpeechAudioResolver } from "./audioSpeechTypes";
import { createAudioSpeechResolver, type AudioSpeechRecording } from "./createAudioSpeechResolver";

interface GraphemeSegmenter {
    segment(text: string): Iterable<{ readonly segment: string }>;
}

type SegmenterConstructor = new (language: string, options: { granularity: "grapheme" }) => GraphemeSegmenter;

function fold(text: string, language: string): string {
    return text.normalize("NFC").toLocaleLowerCase(language).normalize("NFC");
}

function identity(text: string, language: string, whitespaceText = ""): string {
    return JSON.stringify([language.toLowerCase(), text, !text.trim() ? whitespaceText.trim().normalize("NFC") : null]);
}

/**
 * Assembles spelling from application-selected single-grapheme recordings.
 * NFC and locale-aware case folding preserve accents. Punctuation/symbols are
 * ignored; each whitespace grapheme uses a space clip when spellWhitespaceText
 * is supplied, otherwise whitespace is skipped. Any missing letter/digit/space
 * rejects the entire segment. No files are fetched and no pronunciation is guessed.
 * Ordinary reading, empty output, aborted requests, or unavailable Intl.Segmenter
 * return null. Preselect context-dependent readings (such as Mandarin) beforehand.
 */
export function createAudioSpellingResolver(recordings: readonly AudioSpeechRecording[]): SpeechAudioResolver {
    createAudioSpeechResolver(recordings);
    const Constructor = typeof Intl === "undefined" ? undefined
        : (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter;
    if (typeof Constructor !== "function") return () => null;
    const segmenters = new Map<string, GraphemeSegmenter>();
    const clips = new Map<string, SpeechAudioClip>();
    for (const recording of recordings) {
        if (recording.mode !== "spell") continue;
        const language = recording.language.toLowerCase();
        let segmenter = segmenters.get(language);
        if (!segmenter) {
            try {
                segmenter = new Constructor(language, { granularity: "grapheme" });
                if (typeof segmenter.segment !== "function") return () => null;
            } catch { return () => null; }
        }
        segmenters.set(language, segmenter);
        const text = !recording.text.trim() ? " " : fold(recording.text, language);
        if (text !== " " && ([...segmenter.segment(text)].length !== 1
            || !/^[\p{L}\p{N}][\p{L}\p{N}\p{M}\u200c\u200d]*$/u.test(text)))
            throw new TypeError("audio-spelling-recording-invalid");
        const key = identity(text, language, recording.spellWhitespaceText);
        const src = recording.src.trim();
        if (clips.has(key) && clips.get(key)!.src !== src) throw new TypeError("audio-spelling-recording-conflict");
        clips.set(key, Object.freeze({ src }));
    }
    return (segment, signal) => {
        if (signal.aborted || segment.mode !== "spell" || !segment.text || segment.text.length > 16000) return null;
        const language = segment.language.toLowerCase();
        const segmenter = segmenters.get(language);
        if (!segmenter) return null;
        const result: SpeechAudioClip[] = [];
        for (const { segment: grapheme } of segmenter.segment(fold(segment.text, language))) {
            const whitespace = /^\s+$/u.test(grapheme);
            if (whitespace && !segment.spellWhitespaceText?.trim()) continue;
            if (!whitespace && !/[\p{L}\p{N}]/u.test(grapheme)) continue;
            const clip = clips.get(identity(whitespace ? " " : grapheme, language, segment.spellWhitespaceText));
            if (!clip) return null;
            result.push(clip);
        }
        return result.length ? Object.freeze(result) : null;
    };
}
