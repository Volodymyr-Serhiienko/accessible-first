export { createBrowserSpeechEngine, type BrowserSpeechEngineOptions } from "./createBrowserSpeechEngine";
export { createAudioSpeechEngine } from "./createAudioSpeechEngine";
export { createAudioSpeechResolver, type AudioSpeechRecording } from "./createAudioSpeechResolver";
export { createAudioSpellingResolver } from "./createAudioSpellingResolver";
export { createSpeechEngineRouter, type SpeechEngineRouterOptions } from "./createSpeechEngineRouter";
export type {
    AudioSpeechEngineOptions,
    AudioSpeechErrorCode,
    SpeechAudioClip,
    SpeechAudioResolver,
    SpeechAudioSource
} from "./audioSpeechTypes";
export {
    afterSpeechCompletes,
    afterSpeechSettles
} from "./afterSpeechPlayback";
export {
    createBrowserSpeechVoiceCatalog,
    findBrowserSpeechVoice,
    getPreferredBrowserSpeechVoice,
    isBrowserSpeechVoiceCompatible,
    type BrowserSpeechVoice,
    type BrowserSpeechVoiceCatalog,
    type BrowserSpeechVoiceCatalogOptions,
    type BrowserSpeechVoicePreference
} from "./browserSpeechVoices";
export type {
    SpeechEngine,
    SpeechEngineCapabilities,
    SpeechPlayback,
    SpeechPlaybackListener,
    SpeechPlaybackState,
    SpeechPlaybackStatus,
    SpeechRequest,
    SpeechSegment,
    SpeechSegmentMode
} from "./types";
export * from "./createSpeechTask";
