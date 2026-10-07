import { createAudioSpeechPlayback } from "./createAudioSpeechPlayback";
import type { AudioSpeechEngineOptions } from "./audioSpeechTypes";
import type { SpeechEngine, SpeechPlayback, SpeechPlaybackState } from "./types";

function createAudioElement(options: AudioSpeechEngineOptions): HTMLAudioElement | null {
    try {
        const audio = "createAudio" in options
            ? options.createAudio?.() ?? null
            : typeof Audio === "undefined" ? null : new Audio();

        if (!audio || typeof AbortController === "undefined") return null;
        return [audio.play, audio.pause, audio.load, audio.removeAttribute,
            audio.addEventListener, audio.removeEventListener]
            .every((method) => typeof method === "function") ? audio : null;
    } catch {
        return null;
    }
}

function createStaticPlayback(state: SpeechPlaybackState): SpeechPlayback {
    return {
        getState: () => state,
        pause(): void {},
        resume(): void {},
        stop(): void {},
        subscribe(listener): () => void {
            listener(state);
            return () => {};
        }
    };
}

/**
 * Plays ready recordings through the existing SpeechEngine contract.
 * Call speak() from a user action; asynchronous resolution may require a fresh
 * action when a browser rejects playback. This engine never generates or caches audio.
 */
export function createAudioSpeechEngine(options: AudioSpeechEngineOptions): SpeechEngine {
    const audio = createAudioElement(options);
    const supportsSpelling = options.supportsSpelling ?? false;
    let activePlayback: SpeechPlayback | null = null;
    let revision = 0;

    return {
        id: options.id ?? "recorded-audio",
        getCapabilities() {
            const available = audio !== null;
            return { available, pause: available, spelling: available && supportsSpelling };
        },
        speak(request): SpeechPlayback {
            const currentRevision = ++revision;
            const previous = activePlayback;
            activePlayback = null;
            previous?.stop();

            if (currentRevision !== revision) return createStaticPlayback({ status: "idle" });
            if (!audio) return createStaticPlayback({ status: "unavailable" });

            const current = createAudioSpeechPlayback(audio, options, request);
            activePlayback = current.playback;
            current.start();
            return current.playback;
        },
        stop(): void {
            revision += 1;
            const previous = activePlayback;
            activePlayback = null;
            previous?.stop();
        }
    };
}
