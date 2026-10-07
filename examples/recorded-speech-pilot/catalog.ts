import type { AudioSpeechRecording } from "../../packages/core/src/speech";

interface PilotRecipe {
    readonly text: string;
    readonly language: string;
    readonly mode: "text" | "spell";
    readonly voice: string;
    readonly pronunciation?: string;
}

/** Application-owned presentation metadata for the isolated playback example. */
export interface PilotRecording extends AudioSpeechRecording {
    readonly mode: "text" | "spell";
    readonly voice: string;
    readonly whitespaceText: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

/** Reads a bounded local import manifest without fetching its audio files. */
export async function loadPilotRecordings(signal: AbortSignal): Promise<readonly PilotRecording[]> {
    const reading = await loadManifest("recordings/", signal);
    const spelling = await loadManifest("spelling/", signal);
    return [...reading.filter((entry) => entry.mode === "text"), ...spelling];
}

async function loadManifest(directory: string, signal: AbortSignal): Promise<readonly PilotRecording[]> {
    const base = new URL(directory, document.baseURI);
    const response = await fetch(new URL("manifest.json", base), { signal, cache: "no-store" });
    if (!response.ok) throw new Error("pilot-manifest-unavailable");
    const text = await response.text();
    if (text.length > 4 * 1024 * 1024) throw new Error("pilot-manifest-too-large");
    const manifest: unknown = JSON.parse(text);
    if (!isObject(manifest) || manifest.formatVersion !== 1 || !Array.isArray(manifest.recordings)
        || !manifest.recordings.length || manifest.recordings.length > 1000) throw new Error("pilot-manifest-invalid");
    return manifest.recordings.map((entry: unknown) => {
        if (!isObject(entry) || !isObject(entry.recipe) || typeof entry.audioFile !== "string"
            || !/^[a-f0-9]{64}\.(mp3|wav)$/.test(entry.audioFile)) throw new Error("pilot-recording-invalid");
        const recipe = entry.recipe;
        if (typeof recipe.text !== "string" || typeof recipe.language !== "string" || typeof recipe.voice !== "string"
            || (recipe.mode !== "text" && recipe.mode !== "spell")
            || (recipe.pronunciation != null && typeof recipe.pronunciation !== "string")) throw new Error("pilot-recipe-invalid");
        const normalized: PilotRecipe = {
            text: recipe.text, language: recipe.language, voice: recipe.voice, mode: recipe.mode,
            ...(typeof recipe.pronunciation === "string" ? { pronunciation: recipe.pronunciation } : {})
        };
        return {
            text: normalized.text, language: normalized.language, mode: normalized.mode, voice: normalized.voice,
            src: new URL(entry.audioFile, base).href,
            whitespaceText: !normalized.text.trim() ? normalized.pronunciation ?? "" : "",
            ...(!normalized.text.trim() && normalized.pronunciation ? { spellWhitespaceText: normalized.pronunciation } : {})
        };
    });
}
