interface BrowserSpeechVoiceCache {
    voices: readonly SpeechSynthesisVoice[] | null;
    revision: number;
}

const voiceCaches = new WeakMap<SpeechSynthesis, BrowserSpeechVoiceCache>();

type BrowserSpeechVoiceChangeSource = {
    addEventListener?: (type: string, listener: EventListener) => void;
    removeEventListener?: (type: string, listener: EventListener) => void;
};

type BrowserSpeechVoiceSource = {
    getVoices?: () => SpeechSynthesisVoice[];
};

function getVoiceSource(synthesizer: SpeechSynthesis): BrowserSpeechVoiceSource {
    return synthesizer as unknown as BrowserSpeechVoiceSource;
}

function getVoiceChangeSource(
    synthesizer: SpeechSynthesis
): BrowserSpeechVoiceChangeSource {
    return synthesizer as unknown as BrowserSpeechVoiceChangeSource;
}

export function canGetBrowserSpeechVoices(
    synthesizer: SpeechSynthesis
): boolean {
    return typeof getVoiceSource(synthesizer).getVoices === "function";
}

/**
 * Older WebKit builds can expose speechSynthesis without a complete
 * EventTarget surface. Voice discovery must remain an optional enhancement.
 */
export function subscribeToBrowserSpeechVoiceChanges(
    synthesizer: SpeechSynthesis,
    listener: () => void
): () => void {
    const source = getVoiceChangeSource(synthesizer);

    if (typeof source.addEventListener !== "function") {
        return () => {};
    }

    const eventListener: EventListener = () => {
        listener();
    };

    try {
        source.addEventListener("voiceschanged", eventListener);
    } catch {
        return () => {};
    }

    return () => {
        if (typeof source.removeEventListener !== "function") return;

        try {
            source.removeEventListener("voiceschanged", eventListener);
        } catch {
            // Cleanup must be harmless for a partial browser implementation.
        }
    };
}

function readVoices(synthesizer: SpeechSynthesis): readonly SpeechSynthesisVoice[] {
    if (!canGetBrowserSpeechVoices(synthesizer)) return [];

    try {
        return getVoiceSource(synthesizer).getVoices?.() ?? [];
    } catch {
        return [];
    }
}

/** Internal shared cache for browser voice enumeration. */
export function getBrowserSpeechVoiceCache(
    synthesizer: SpeechSynthesis
): BrowserSpeechVoiceCache {
    let cache = voiceCaches.get(synthesizer);

    if (!cache) {
        cache = {
            voices: null,
            revision: 0
        };

        const cacheToReset = cache;
        subscribeToBrowserSpeechVoiceChanges(synthesizer, () => {
            cacheToReset.voices = null;
            cacheToReset.revision += 1;
        });
        voiceCaches.set(synthesizer, cache);
    }

    return cache;
}

export function getCachedBrowserSpeechVoices(
    synthesizer: SpeechSynthesis
): readonly SpeechSynthesisVoice[] {
    const cache = getBrowserSpeechVoiceCache(synthesizer);
    cache.voices ??= readVoices(synthesizer);

    return cache.voices;
}

export function refreshCachedBrowserSpeechVoices(
    synthesizer: SpeechSynthesis
): readonly SpeechSynthesisVoice[] {
    const cache = getBrowserSpeechVoiceCache(synthesizer);

    cache.voices = readVoices(synthesizer);
    cache.revision += 1;

    return cache.voices;
}
