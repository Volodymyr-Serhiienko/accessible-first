export { createBrowserSpeechEngine, type BrowserSpeechEngineOptions } from "./createBrowserSpeechEngine";
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
