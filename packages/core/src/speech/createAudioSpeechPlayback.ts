import type {
    AudioSpeechEngineOptions,
    AudioSpeechErrorCode,
    SpeechAudioSource
} from "./audioSpeechTypes";
import type {
    SpeechPlayback,
    SpeechPlaybackListener,
    SpeechPlaybackState,
    SpeechRequest
} from "./types";

function bounded(value: number | undefined, fallback: number, min: number, max: number): number {
    return value !== undefined && Number.isFinite(value)
        ? Math.min(max, Math.max(min, value)) : fallback;
}

function isPendingSource(
    source: SpeechAudioSource | PromiseLike<SpeechAudioSource>
): source is PromiseLike<SpeechAudioSource> {
    return source !== null && "then" in source && typeof source.then === "function";
}

function getPlayError(error: unknown): AudioSpeechErrorCode {
    const name = error && typeof error === "object" && "name" in error ? error.name : null;
    if (name === "NotAllowedError") return "audio-playback-blocked";
    if (name === "NotSupportedError") return "audio-format-unsupported";
    return "audio-playback-failed";
}

/** Internal playback lifecycle; activation is separate so the engine owns it before resolving. */
export function createAudioSpeechPlayback(
    audio: HTMLAudioElement,
    options: AudioSpeechEngineOptions,
    request: SpeechRequest
): { playback: SpeechPlayback; start(): void } {
    const segments = request.segments
        .filter((segment) => segment.mode === "spell" ? segment.text.length > 0 : segment.text.trim())
        .map((segment) => ({ ...segment, text: segment.mode === "spell" && !segment.text.trim()
            ? segment.text : segment.text.trim() }));
    const controller = new AbortController();
    const listeners = new Set<SpeechPlaybackListener>();
    const defaultRate = bounded(request.rate, 1, 0.25, 4);
    const volume = bounded(request.volume, 1, 0, 1);
    const configuredTimeout = options.startTimeoutMs ?? 15000;
    const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout : 15000;
    let state: SpeechPlaybackState = { status: "idle" };
    let segmentIndex = 0;
    let sources: readonly string[] | null = null;
    let sourceIndex = 0;
    let resolving = false;
    let loaded = false;
    let clipRevision = 0;
    let playRevision = 0;
    let removeMediaListeners: (() => void) | null = null;
    let waitTimer: ReturnType<typeof setTimeout> | undefined;

    function active(): boolean {
        return !controller.signal.aborted && (state.status === "speaking" || state.status === "paused");
    }

    function notify(): void {
        listeners.forEach((listener) => listener(state));
    }

    function clearWait(): void {
        clearTimeout(waitTimer);
        waitTimer = undefined;
    }

    function detachMedia(): void {
        try { removeMediaListeners?.(); } catch { /* Best-effort cleanup on partial media APIs. */ }
        removeMediaListeners = null;
    }

    function finish(status: "idle" | "completed" | "error" | "unavailable", error?: AudioSpeechErrorCode): void {
        if (!active()) return;
        state = error === undefined ? { status } : { status, error };
        clipRevision += 1;
        playRevision += 1;
        clearWait();
        detachMedia();
        try { audio.pause(); } catch { /* Cleanup must not prevent cancellation. */ }
        try {
            audio.removeAttribute("src");
            audio.load();
        } catch { /* Partial media implementations may reject resource release. */ }
        controller.abort();
        notify();
    }

    function waitFor(error: AudioSpeechErrorCode): void {
        clearWait();
        if (state.status === "speaking") {
            waitTimer = setTimeout(() => finish("error", error), timeoutMs);
        }
    }

    function playCurrent(): void {
        if (!active() || state.status !== "speaking") return;
        const clip = clipRevision;
        const attempt = ++playRevision;
        waitFor("audio-playback-timeout");
        try {
            const result = audio.play();
            // Older browsers may return void; the playing event also confirms startup.
            result?.then(() => {
                if (clip === clipRevision && attempt === playRevision && active()) clearWait();
            }, (error: unknown) => {
                if (clip === clipRevision && attempt === playRevision && state.status === "speaking" && active()) {
                    finish("error", getPlayError(error));
                }
            });
        } catch (error) {
            finish("error", getPlayError(error));
        }
    }

    function loadSource(src: string): void {
        const clip = ++clipRevision;
        const current = (): boolean => clip === clipRevision && active();
        function onPlaying(): void {
            if (current()) clearWait();
        }
        function onWaiting(): void {
            if (current()) waitFor("audio-playback-timeout");
        }
        function onEnded(): void {
            // A queued event from a replaced resource must not finish the new resource.
            if (!current() || !audio.ended) return;
            clearWait();
            detachMedia();
            clipRevision += 1;
            loaded = false;
            sourceIndex += 1;
            advance();
        }
        function onError(): void {
            if (current() && audio.error) finish("error", "audio-media-failed");
        }
        removeMediaListeners = () => {
            audio.removeEventListener("playing", onPlaying);
            audio.removeEventListener("waiting", onWaiting);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
        };
        try {
            audio.addEventListener("playing", onPlaying);
            audio.addEventListener("waiting", onWaiting);
            audio.addEventListener("ended", onEnded);
            audio.addEventListener("error", onError);
            audio.preload = "auto";
            audio.loop = false;
            audio.volume = volume;
            audio.src = src;
            audio.load();
            // load() restores defaultPlaybackRate; apply the requested rate afterwards.
            audio.playbackRate = bounded(segments[segmentIndex]?.rate, defaultRate, 0.25, 4);
            loaded = true;
            playCurrent();
        } catch {
            finish("error", "audio-playback-failed");
        }
    }

    function acceptSource(source: SpeechAudioSource, index: number): void {
        if (!active() || index !== segmentIndex) return;
        clearWait();
        resolving = false;
        if (source === null || (Array.isArray(source) && source.length === 0)) {
            finish("unavailable", "audio-source-missing");
            return;
        }
        const clips = Array.isArray(source) ? source : [source];
        if (clips.some((clip) => !clip || typeof clip.src !== "string" || !clip.src.trim())) {
            finish("error", "audio-source-invalid");
            return;
        }
        sources = clips.map((clip) => clip.src.trim());
        advance();
    }

    function advance(): void {
        if (!active() || state.status !== "speaking") return;
        if (resolving) {
            waitFor("audio-resolve-timeout");
            return;
        }
        if (loaded) {
            playCurrent();
            return;
        }
        if (sources) {
            const src = sources[sourceIndex];
            if (src !== undefined) {
                loadSource(src);
                return;
            }
            sources = null;
            sourceIndex = 0;
            segmentIndex += 1;
        }
        const segment = segments[segmentIndex];
        if (!segment) {
            finish("completed");
            return;
        }
        resolving = true;
        waitFor("audio-resolve-timeout");
        const index = segmentIndex;
        try {
            const source = options.resolveSegment(segment, controller.signal);
            if (isPendingSource(source)) {
                void Promise.resolve(source).then((result) => acceptSource(result, index), () => {
                    if (active() && index === segmentIndex) finish("error", "audio-resolve-failed");
                });
            } else {
                acceptSource(source, index);
            }
        } catch {
            finish("error", "audio-resolve-failed");
        }
    }

    const playback: SpeechPlayback = {
        getState: () => state,
        pause(): void {
            if (state.status !== "speaking") return;
            state = { status: "paused" };
            playRevision += 1;
            clearWait();
            try { audio.pause(); } catch { finish("error", "audio-playback-failed"); return; }
            notify();
        },
        resume(): void {
            if (state.status !== "paused") return;
            state = { status: "speaking" };
            notify();
            advance();
        },
        stop(): void { finish("idle"); },
        subscribe(listener): () => void {
            listeners.add(listener);
            listener(state);
            return () => { listeners.delete(listener); };
        }
    };

    return {
        playback,
        start(): void {
            if (state.status !== "idle" || controller.signal.aborted) return;
            state = { status: "speaking" };
            if (!options.supportsSpelling && segments.some((segment) => segment.mode === "spell")) {
                finish("unavailable", "audio-spelling-unavailable");
                return;
            }
            advance();
        }
    };
}
