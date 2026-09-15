import type {
    SpeechEngine,
    SpeechEngineCapabilities,
    SpeechPlayback,
    SpeechPlaybackListener,
    SpeechPlaybackState,
    SpeechPlaybackStatus,
    SpeechRequest,
    SpeechSegment
} from "./types";

/** Options for the browser Web Speech API engine. */
export interface BrowserSpeechEngineOptions {
    speechSynthesis?: SpeechSynthesis | null;
    createUtterance?: ((text: string) => SpeechSynthesisUtterance) | null;
}

interface SpeechQueueItem {
    readonly text: string;
    readonly language: string;
    readonly rate: number | undefined;
}

type UtteranceFactory = (text: string) => SpeechSynthesisUtterance;

function getDefaultSpeechSynthesis(): SpeechSynthesis | null {
    return typeof speechSynthesis === "undefined"
        ? null
        : speechSynthesis;
}

function getDefaultUtteranceFactory(): UtteranceFactory | null {
    if (typeof SpeechSynthesisUtterance === "undefined") {
        return null;
    }

    return (text) => new SpeechSynthesisUtterance(text);
}

function createState(
    status: SpeechPlaybackStatus,
    error?: string
): SpeechPlaybackState {
    return error === undefined
        ? { status }
        : { status, error };
}

function createStaticPlayback(
    initialState: SpeechPlaybackState
): SpeechPlayback {
    const listeners = new Set<SpeechPlaybackListener>();

    return {
        getState(): SpeechPlaybackState {
            return initialState;
        },

        pause(): void {},

        resume(): void {},

        stop(): void {},

        subscribe(listener: SpeechPlaybackListener): () => void {
            listeners.add(listener);
            listener(initialState);

            return () => {
                listeners.delete(listener);
            };
        }
    };
}

function getSpeechQueue(
    segments: readonly SpeechSegment[]
): readonly SpeechQueueItem[] {
    return segments.flatMap((segment) => {
        const text = segment.text.trim();

        if (!text) {
            return [];
        }

        if (segment.mode !== "spell") {
            return [{
                text,
                language: segment.language,
                rate: segment.rate
            }];
        }

        return Array.from(text)
            .filter((character) => /[\p{L}\p{N}]/u.test(character))
            .map((character) => ({
                text: character,
                language: segment.language,
                rate: segment.rate
            }));
    });
}

function getPreferredVoice(
    voices: readonly SpeechSynthesisVoice[],
    language: string
): SpeechSynthesisVoice | null {
    const normalizedLanguage = language.toLowerCase();
    const baseLanguage = normalizedLanguage.split("-")[0];

    return voices.find(
        (voice) => voice.lang.toLowerCase() === normalizedLanguage
    ) ?? voices.find(
        (voice) => voice.lang.toLowerCase().split("-")[0] === baseLanguage
    ) ?? null;
}

function createBrowserPlayback(
    synthesizer: SpeechSynthesis,
    createUtterance: UtteranceFactory,
    request: SpeechRequest
): SpeechPlayback {
    const queue = getSpeechQueue(request.segments);
    const listeners = new Set<SpeechPlaybackListener>();
    const defaultRate = Math.min(10, Math.max(0.1, request.rate ?? 1));
    const volume = Math.min(1, Math.max(0, request.volume ?? 1));

    let currentIndex = 0;
    let currentUtterance: SpeechSynthesisUtterance | null = null;
    let utteranceRevision = 0;
    let state = createState("idle");

    function notify(): void {
        listeners.forEach((listener) => {
            listener(state);
        });
    }

    function setState(
        status: SpeechPlaybackStatus,
        error?: string
    ): void {
        state = createState(status, error);
        notify();
    }

    function cancelCurrentUtterance(): void {
        utteranceRevision += 1;
        currentUtterance = null;
        synthesizer.cancel();
    }

    function speakNext(): void {
        if (state.status !== "speaking") {
            return;
        }

        const next = queue[currentIndex];

        if (!next) {
            currentUtterance = null;
            setState("completed");
            return;
        }

        const revision = ++utteranceRevision;
        const utterance = createUtterance(next.text);
        const voice = getPreferredVoice(
            synthesizer.getVoices(),
            next.language
        );

        utterance.lang = next.language;
        utterance.rate = Math.min(10, Math.max(0.1, next.rate ?? defaultRate));
        utterance.volume = volume;

        if (voice) {
            utterance.voice = voice;
        }

        utterance.onend = () => {
            if (
                revision !== utteranceRevision
                || state.status !== "speaking"
            ) {
                return;
            }

            currentUtterance = null;
            currentIndex += 1;
            speakNext();
        };

        utterance.onerror = (event) => {
            if (
                revision !== utteranceRevision
                || (
                    state.status !== "speaking"
                    && state.status !== "paused"
                )
            ) {
                return;
            }

            if (
                event.error === "canceled"
                || event.error === "interrupted"
            ) {
                setState("idle");
                return;
            }

            currentUtterance = null;
            setState("error", event.error);
        };

        currentUtterance = utterance;
        synthesizer.speak(utterance);
    }

    function start(): void {
        if (queue.length === 0) {
            setState("completed");
            return;
        }

        setState("speaking");
        speakNext();
    }

    start();

    return {
        getState(): SpeechPlaybackState {
            return state;
        },

        pause(): void {
            if (state.status !== "speaking") {
                return;
            }

            /* Browser resume() is unreliable on several mobile engines. */
            cancelCurrentUtterance();
            setState("paused");
        },

        resume(): void {
            if (state.status !== "paused") {
                return;
            }

            setState("speaking");
            speakNext();
        },

        stop(): void {
            if (
                state.status === "idle"
                || state.status === "completed"
                || state.status === "unavailable"
                || state.status === "error"
            ) {
                return;
            }

            cancelCurrentUtterance();
            setState("idle");
        },

        subscribe(listener: SpeechPlaybackListener): () => void {
            listeners.add(listener);
            listener(state);

            return () => {
                listeners.delete(listener);
            };
        }
    };
}

/**
 * Creates a Web Speech API adapter for ordered, multilingual speech requests.
 *
 * A visible user-initiated action should call speak(); browsers can reject
 * speech started automatically during page load.
 */
export function createBrowserSpeechEngine(
    options: BrowserSpeechEngineOptions = {}
): SpeechEngine {
    const synthesizer = "speechSynthesis" in options
        ? options.speechSynthesis ?? null
        : getDefaultSpeechSynthesis();

    const createUtterance = "createUtterance" in options
        ? options.createUtterance ?? null
        : getDefaultUtteranceFactory();

    let activePlayback: SpeechPlayback | null = null;

    function getCapabilities(): SpeechEngineCapabilities {
        const available = Boolean(synthesizer && createUtterance);

        return {
            available,
            pause: available,
            spelling: available
        };
    }

    return {
        id: "browser-speech-synthesis",

        getCapabilities,

        speak(request: SpeechRequest): SpeechPlayback {
            activePlayback?.stop();

            if (!synthesizer || !createUtterance) {
                activePlayback = createStaticPlayback(
                    createState("unavailable")
                );

                return activePlayback;
            }

            activePlayback = createBrowserPlayback(
                synthesizer,
                createUtterance,
                request
            );

            return activePlayback;
        },

        stop(): void {
            activePlayback?.stop();
            activePlayback = null;
        }
    };
}
