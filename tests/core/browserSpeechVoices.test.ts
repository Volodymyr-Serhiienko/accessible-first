import { describe, expect, it, vi } from "vitest";
import {
    createBrowserSpeechVoiceCatalog,
    findBrowserSpeechVoice
} from "../../packages/core/src/speech";

interface FakeSynthesizer {
    readonly synthesis: SpeechSynthesis;
    setVoices(voices: readonly SpeechSynthesisVoice[], notify?: boolean): void;
}

function createVoice(options: {
    name: string;
    lang: string;
    voiceURI: string;
    local?: boolean;
    default?: boolean;
}): SpeechSynthesisVoice {
    return {
        name: options.name,
        lang: options.lang,
        voiceURI: options.voiceURI,
        localService: options.local ?? true,
        default: options.default ?? false
    } as SpeechSynthesisVoice;
}

function createFakeSynthesizer(
    initialVoices: readonly SpeechSynthesisVoice[] = []
): FakeSynthesizer {
    let voices = initialVoices;
    const listeners = new Set<EventListener>();

    return {
        synthesis: {
            getVoices(): SpeechSynthesisVoice[] {
                return [...voices];
            },

            addEventListener(
                type: string,
                listener: EventListenerOrEventListenerObject | null
            ): void {
                if (type === "voiceschanged" && typeof listener === "function") {
                    listeners.add(listener);
                }
            },

            removeEventListener(
                type: string,
                listener: EventListenerOrEventListenerObject | null
            ): void {
                if (type === "voiceschanged" && typeof listener === "function") {
                    listeners.delete(listener);
                }
            }
        } as unknown as SpeechSynthesis,

        setVoices(nextVoices, notify = true): void {
            voices = nextVoices;

            if (!notify) return;

            for (const listener of listeners) {
                listener(new Event("voiceschanged"));
            }
        }
    };
}

describe("browser speech voices", () => {
    it("lists compatible voices and refreshes subscribers after delayed discovery", () => {
        const fake = createFakeSynthesizer();
        const catalog = createBrowserSpeechVoiceCatalog({
            speechSynthesis: fake.synthesis
        });
        const listener = vi.fn();
        const unsubscribe = catalog.subscribe(listener);

        expect(listener).toHaveBeenLastCalledWith([]);

        const remoteNorwegianVoice = createVoice({
            name: "Remote Norwegian",
            lang: "no-NO",
            voiceURI: "remote-no",
            local: false
        });
        const localNorwegianVoice = createVoice({
            name: "Local Norwegian",
            lang: "nb-NO",
            voiceURI: "local-nb",
            local: true,
            default: true
        });
        const EnglishVoice = createVoice({
            name: "English",
            lang: "en-US",
            voiceURI: "en-us"
        });

        fake.setVoices([remoteNorwegianVoice, EnglishVoice, localNorwegianVoice]);

        expect(catalog.getVoices("nb-NO").map((voice) => voice.name)).toEqual([
            "Local Norwegian",
            "Remote Norwegian"
        ]);
        expect(listener).toHaveBeenLastCalledWith(expect.arrayContaining([
            expect.objectContaining({ name: "English" })
        ]));

        unsubscribe();
        catalog.destroy();
    });

    it("matches a stored preference by URI before its descriptive fallback", () => {
        const firstVoice = createVoice({
            name: "Shared name",
            lang: "en-US",
            voiceURI: "first-en"
        });
        const selectedVoice = createVoice({
            name: "Shared name",
            lang: "en-US",
            voiceURI: "selected-en"
        });

        expect(findBrowserSpeechVoice(
            [firstVoice, selectedVoice],
            "en-GB",
            {
                name: "Shared name",
                lang: "en-US",
                voiceURI: "selected-en"
            }
        )).toBe(selectedVoice);
    });

    it("normalizes mobile voice tags and refreshes a stale list on demand", () => {
        const fake = createFakeSynthesizer();
        const catalog = createBrowserSpeechVoiceCatalog({
            speechSynthesis: fake.synthesis
        });
        const listener = vi.fn();
        const unsubscribe = catalog.subscribe(listener);
        const UkrainianVoice = createVoice({
            name: "Ukrainian device voice",
            lang: "uk_UA",
            voiceURI: "uk-ua"
        });
        const EnglishVoice = createVoice({
            name: "English device voice",
            lang: "eng-US-f000",
            voiceURI: "eng-us"
        });
        const ChineseVoice = createVoice({
            name: "Chinese device voice",
            lang: "cmn-CN",
            voiceURI: "cmn-cn"
        });

        fake.setVoices([UkrainianVoice, EnglishVoice, ChineseVoice], false);

        expect(catalog.getVoices("uk-UA")).toEqual([]);

        catalog.refresh();

        expect(catalog.getVoices("uk-UA").map((voice) => voice.name)).toEqual([
            "Ukrainian device voice"
        ]);
        expect(catalog.getVoices("en-US").map((voice) => voice.name)).toEqual([
            "English device voice"
        ]);
        expect(catalog.getVoices("zh-Hans").map((voice) => voice.name)).toEqual([
            "Chinese device voice"
        ]);
        expect(listener).toHaveBeenLastCalledWith(expect.arrayContaining([
            expect.objectContaining({ name: "Ukrainian device voice" })
        ]));

        unsubscribe();
        catalog.destroy();
    });

    it("keeps manual voice discovery available without a voice-change event API", () => {
        const EnglishVoice = createVoice({
            name: "Older WebKit English",
            lang: "en-US",
            voiceURI: "older-webkit-en"
        });
        const partialSynthesizer = {
            getVoices(): SpeechSynthesisVoice[] {
                return [EnglishVoice];
            }
        } as unknown as SpeechSynthesis;

        const catalog = createBrowserSpeechVoiceCatalog({
            speechSynthesis: partialSynthesizer
        });

        expect(catalog.isAvailable()).toBe(true);
        expect(catalog.getVoices("en-GB").map((voice) => voice.name)).toEqual([
            "Older WebKit English"
        ]);
        expect(() => catalog.destroy()).not.toThrow();
    });

    it("does not fail when an incomplete browser rejects event subscription", () => {
        const EnglishVoice = createVoice({
            name: "Restricted English",
            lang: "en-US",
            voiceURI: "restricted-en"
        });
        const partialSynthesizer = {
            getVoices(): SpeechSynthesisVoice[] {
                return [EnglishVoice];
            },
            addEventListener(): void {
                throw new Error("Voice events are unavailable.");
            }
        } as unknown as SpeechSynthesis;

        expect(() => {
            const catalog = createBrowserSpeechVoiceCatalog({
                speechSynthesis: partialSynthesizer
            });

            expect(catalog.refresh().map((voice) => voice.name)).toEqual([
                "Restricted English"
            ]);
            catalog.destroy();
        }).not.toThrow();
    });
});
