import {
    canGetBrowserSpeechVoices,
    getBrowserSpeechVoiceCache,
    getCachedBrowserSpeechVoices,
    refreshCachedBrowserSpeechVoices,
    subscribeToBrowserSpeechVoiceChanges
} from "./browserSpeechVoiceCache";

export interface BrowserSpeechVoicePreference {
    readonly voiceURI: string;
    readonly name: string;
    readonly lang: string;
}

export interface BrowserSpeechVoice extends BrowserSpeechVoicePreference {
    readonly id: string;
    readonly local: boolean;
    readonly default: boolean;
}

export interface BrowserSpeechVoiceCatalogOptions {
    speechSynthesis?: SpeechSynthesis | null;
}

export interface BrowserSpeechVoiceCatalog {
    isAvailable(): boolean;
    getVoices(language?: string): readonly BrowserSpeechVoice[];
    refresh(): readonly BrowserSpeechVoice[];
    subscribe(listener: (voices: readonly BrowserSpeechVoice[]) => void): () => void;
    destroy(): void;
}

function getDefaultSpeechSynthesis(): SpeechSynthesis | null {
    try {
        return typeof speechSynthesis === "undefined"
            ? null
            : speechSynthesis;
    } catch {
        return null;
    }
}

const languageAliases: Readonly<Record<string, string>> = {
    chi: "zh",
    cmn: "zh",
    deu: "de",
    eng: "en",
    ger: "de",
    nob: "nb",
    nor: "no",
    rus: "ru",
    ukr: "uk",
    zho: "zh"
};

function normalizeLanguageTag(language: string): string {
    const normalized = language.trim().replace(/_/g, "-");

    if (!normalized) return "";

    try {
        const [canonical] = Intl.getCanonicalLocales(normalized);

        if (canonical) return canonical.toLowerCase();
    } catch {
        // Some mobile engines expose non-canonical tags such as eng-US-f000.
    }

    const parts = normalized.toLowerCase().split("-");
    const base = parts[0] ?? "";

    return [languageAliases[base] ?? base, ...parts.slice(1)]
        .filter(Boolean)
        .join("-");
}

function getLanguageBase(language: string): string {
    return normalizeLanguageTag(language).split("-")[0] ?? "";
}

function getLanguageFamily(language: string): readonly string[] {
    const base = getLanguageBase(language);

    if (base === "nb" || base === "no") {
        return ["nb", "no"];
    }

    if (base === "zh" || base === "cmn") {
        return ["zh", "cmn"];
    }

    return base ? [base] : [];
}

function getLanguageMatchRank(candidate: string, requested: string): number | null {
    const normalizedCandidate = normalizeLanguageTag(candidate);
    const normalizedRequested = normalizeLanguageTag(requested);

    if (!normalizedCandidate || !normalizedRequested) {
        return null;
    }

    if (normalizedCandidate === normalizedRequested) {
        return 0;
    }

    return getLanguageFamily(normalizedRequested).includes(
        getLanguageBase(normalizedCandidate)
    ) ? 1 : null;
}

function toBrowserSpeechVoice(voice: SpeechSynthesisVoice): BrowserSpeechVoice {
    return {
        id: JSON.stringify([voice.voiceURI, voice.name, voice.lang]),
        voiceURI: voice.voiceURI,
        name: voice.name,
        lang: voice.lang,
        local: voice.localService,
        default: voice.default
    };
}

function compareVoices(
    requestedLanguage: string | undefined,
    first: SpeechSynthesisVoice,
    second: SpeechSynthesisVoice
): number {
    const firstRank = requestedLanguage === undefined
        ? 0
        : getLanguageMatchRank(first.lang, requestedLanguage) ?? Number.MAX_SAFE_INTEGER;
    const secondRank = requestedLanguage === undefined
        ? 0
        : getLanguageMatchRank(second.lang, requestedLanguage) ?? Number.MAX_SAFE_INTEGER;

    if (firstRank !== secondRank) return firstRank - secondRank;
    if (first.localService !== second.localService) return first.localService ? -1 : 1;
    if (first.default !== second.default) return first.default ? -1 : 1;

    return first.name.localeCompare(second.name, undefined, { sensitivity: "base" });
}

export function isBrowserSpeechVoiceCompatible(
    voice: Pick<BrowserSpeechVoicePreference, "lang"> | SpeechSynthesisVoice,
    language: string
): boolean {
    return getLanguageMatchRank(voice.lang, language) !== null;
}

export function findBrowserSpeechVoice(
    voices: readonly SpeechSynthesisVoice[],
    language: string,
    preference: BrowserSpeechVoicePreference | null | undefined
): SpeechSynthesisVoice | null {
    if (!preference || !isBrowserSpeechVoiceCompatible(preference, language)) {
        return null;
    }

    const compatibleVoices = voices.filter((voice) =>
        isBrowserSpeechVoiceCompatible(voice, language)
    );

    if (preference.voiceURI) {
        const byUri = compatibleVoices.find((voice) =>
            voice.voiceURI === preference.voiceURI
        );

        if (byUri) return byUri;
    }

    return compatibleVoices.find((voice) =>
        voice.name === preference.name
        && normalizeLanguageTag(voice.lang) === normalizeLanguageTag(preference.lang)
    ) ?? compatibleVoices.find((voice) => voice.name === preference.name) ?? null;
}

export function getPreferredBrowserSpeechVoice(
    voices: readonly SpeechSynthesisVoice[],
    language: string
): SpeechSynthesisVoice | null {
    return voices.find((voice) =>
        getLanguageMatchRank(voice.lang, language) === 0
    ) ?? voices.find((voice) => isBrowserSpeechVoiceCompatible(voice, language)) ?? null;
}

export function createBrowserSpeechVoiceCatalog(
    options: BrowserSpeechVoiceCatalogOptions = {}
): BrowserSpeechVoiceCatalog {
    const synthesizer = "speechSynthesis" in options
        ? options.speechSynthesis ?? null
        : getDefaultSpeechSynthesis();
    const listeners = new Set<(voices: readonly BrowserSpeechVoice[]) => void>();
    let destroyed = false;

    if (synthesizer) {
        // Register the shared listener first so voice changes invalidate it
        // before this catalog publishes its refreshed list.
        getBrowserSpeechVoiceCache(synthesizer);
    }

    function getVoices(language?: string): readonly BrowserSpeechVoice[] {
        if (!synthesizer || destroyed) return [];

        return getCachedBrowserSpeechVoices(synthesizer)
            .filter((voice) => language === undefined || isBrowserSpeechVoiceCompatible(voice, language))
            .slice()
            .sort((first, second) => compareVoices(language, first, second))
            .map(toBrowserSpeechVoice);
    }

    function notifyListeners(voices: readonly BrowserSpeechVoice[]): void {
        listeners.forEach((listener) => {
            listener(voices);
        });
    }

    function refresh(): readonly BrowserSpeechVoice[] {
        if (!synthesizer || destroyed) return [];

        refreshCachedBrowserSpeechVoices(synthesizer);
        const voices = getVoices();
        notifyListeners(voices);

        return voices;
    }

    const handleVoicesChanged = (): void => {
        refresh();
    };

    const unsubscribeVoiceChanges = synthesizer
        ? subscribeToBrowserSpeechVoiceChanges(synthesizer, handleVoicesChanged)
        : () => {};

    return {
        isAvailable(): boolean {
            return synthesizer !== null
                && canGetBrowserSpeechVoices(synthesizer)
                && !destroyed;
        },

        getVoices,

        refresh,

        subscribe(listener): () => void {
            if (destroyed) return () => {};

            listeners.add(listener);
            listener(getVoices());

            return () => {
                listeners.delete(listener);
            };
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            listeners.clear();
            unsubscribeVoiceChanges();
        }
    };
}
