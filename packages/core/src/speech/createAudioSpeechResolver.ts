import type { SpeechAudioClip, SpeechAudioResolver } from "./audioSpeechTypes";
import type { SpeechSegmentMode } from "./types";

/** One ready recording selected by the application, without provider or storage dependencies. */
export interface AudioSpeechRecording extends SpeechAudioClip {
    readonly text: string;
    readonly language: string;
    readonly mode?: SpeechSegmentMode;
    /** Exact localized whitespace word represented by a dedicated spelling-space clip. */
    readonly spellWhitespaceText?: string;
}

function key(text: string, language: string, mode: SpeechSegmentMode, whitespaceText?: string): string {
    const normalized = text.normalize("NFC");
    return JSON.stringify([language.toLowerCase(), mode, mode === "spell" && !normalized.trim()
        ? normalized : normalized.trim(), mode === "spell" && !normalized.trim()
        ? whitespaceText?.trim().normalize("NFC") ?? "" : null]);
}

/**
 * Indexes exact text/language/mode recordings for synchronous audio resolution.
 * Preselect voices/pronunciation variants in the application. Conflicting entries
 * are rejected, not silently replaced; missing or aborted requests return null.
 * This helper does not fetch files, assemble spelling, or switch to another voice.
 */
export function createAudioSpeechResolver(recordings: readonly AudioSpeechRecording[]): SpeechAudioResolver {
    if (recordings.length > 10000) throw new RangeError("audio-catalog-too-large");
    const index = new Map<string, SpeechAudioClip>();
    for (const recording of recordings) {
        const mode = recording.mode ?? "text";
        if (typeof recording.text !== "string" || !recording.text || recording.text.length > 16000
            || (mode === "text" && !recording.text.trim()) || (mode !== "text" && mode !== "spell")
            || typeof recording.language !== "string" || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(recording.language)
            || recording.language.length > 64 || typeof recording.src !== "string" || !recording.src.trim()
            || recording.src.length > 4096 || (recording.spellWhitespaceText !== undefined
                && (typeof recording.spellWhitespaceText !== "string" || recording.spellWhitespaceText.length > 4096)))
            throw new TypeError("audio-recording-invalid");
        const identity = key(recording.text, recording.language, mode, recording.spellWhitespaceText);
        const src = recording.src.trim();
        const existing = index.get(identity);
        if (existing && existing.src !== src) throw new TypeError("audio-recording-conflict");
        index.set(identity, Object.freeze({ src }));
    }
    return (segment, signal) => signal.aborted ? null
        : index.get(key(segment.text, segment.language, segment.mode ?? "text", segment.spellWhitespaceText)) ?? null;
}
