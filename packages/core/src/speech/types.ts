/** Reading mode for one speech segment. */
export type SpeechSegmentMode = "text" | "spell";

/** One ordered piece of text submitted to a SpeechEngine. */
export interface SpeechSegment {
    readonly text: string;
    /** BCP 47 language tag used to choose a voice. */
    readonly language: string;
    /** Reads text normally by default, or spells letters and numbers individually. */
    readonly mode?: SpeechSegmentMode;
    /**
     * Optional localized word spoken for whitespace while spelling.
     * Punctuation is always omitted from spelling output.
     */
    readonly spellWhitespaceText?: string;
    /** Optional per-segment rate that overrides the request rate. */
    readonly rate?: number;
}

/** A complete speech request, optionally containing several languages. */
export interface SpeechRequest {
    readonly segments: readonly SpeechSegment[];
    /** Default rate for segments that do not supply one. */
    readonly rate?: number;
    /** Request volume between 0 and 1. */
    readonly volume?: number;
}

/** Capabilities advertised by a SpeechEngine implementation. */
export interface SpeechEngineCapabilities {
    readonly available: boolean;
    readonly pause: boolean;
    readonly spelling: boolean;
}

/** Lifecycle status of one speech playback. */
export type SpeechPlaybackStatus =
    | "idle"
    | "completed"
    | "speaking"
    | "paused"
    | "unavailable"
    | "error";

/** Current state emitted by a speech playback. */
export interface SpeechPlaybackState {
    readonly status: SpeechPlaybackStatus;
    readonly error?: string;
}

/** Listener notified whenever a speech playback state changes. */
export type SpeechPlaybackListener = (state: SpeechPlaybackState) => void;

/** Controller for one started speech request. */
export interface SpeechPlayback {
    getState(): SpeechPlaybackState;
    pause(): void;
    resume(): void;
    stop(): void;
    subscribe(listener: SpeechPlaybackListener): () => void;
}

/** Provider-neutral interface for browser, recorded-audio, or remote speech engines. */
export interface SpeechEngine {
    readonly id: string;
    getCapabilities(): SpeechEngineCapabilities;
    speak(request: SpeechRequest): SpeechPlayback;
    stop(): void;
}
