interface BrowserSpeechVoiceCache {
    voices: readonly SpeechSynthesisVoice[] | null;
    revision: number;
}

const voiceCaches = new WeakMap<SpeechSynthesis, BrowserSpeechVoiceCache>();

function readVoices(synthesizer: SpeechSynthesis): readonly SpeechSynthesisVoice[] {
    try {
        return synthesizer.getVoices();
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
        synthesizer.addEventListener("voiceschanged", () => {
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
