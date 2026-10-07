import type { SpeechSegment } from "./types";

/** One application-owned audio recording; its URL may be relative, remote, or a blob URL. */
export interface SpeechAudioClip {
    readonly src: string;
}

/** Recordings for one segment, or null when its requested language/mode is unavailable. */
export type SpeechAudioSource = SpeechAudioClip | readonly SpeechAudioClip[] | null;

/** Resolves recordings without coupling playback to a provider, catalog, or storage backend. */
export type SpeechAudioResolver = (
    segment: SpeechSegment,
    signal: AbortSignal
) => SpeechAudioSource | PromiseLike<SpeechAudioSource>;

/** Machine-readable failures; applications supply localized feedback, not these codes. */
export type AudioSpeechErrorCode =
    | "audio-source-missing"
    | "audio-source-invalid"
    | "audio-spelling-unavailable"
    | "audio-resolve-failed"
    | "audio-resolve-timeout"
    | "audio-playback-blocked"
    | "audio-format-unsupported"
    | "audio-media-failed"
    | "audio-playback-failed"
    | "audio-playback-timeout";

/** Options for provider-neutral playback of ready audio recordings. */
export interface AudioSpeechEngineOptions {
    /** Return a matching recording or ordered recordings; never silently substitute another language/mode. */
    resolveSegment: SpeechAudioResolver;
    /** Optional application identifier; defaults to recorded-audio. */
    id?: string;
    /**
     * Supplies one dedicated audio element owned by this engine. Null disables the engine.
     * By default, the engine safely creates an HTMLAudioElement without starting audio.
     */
    createAudio?: (() => HTMLAudioElement) | null;
    /** Opt in only when the resolver supplies actual spelling recordings; defaults to false. */
    supportsSpelling?: boolean;
    /** Maximum wait for resolution or playback startup; defaults to 15000 ms, suspended on pause. */
    startTimeoutMs?: number;
}
