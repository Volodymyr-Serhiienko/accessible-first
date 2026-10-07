import type {
    SpeechEngine,
    SpeechEngineCapabilities,
    SpeechPlayback,
    SpeechPlaybackListener,
    SpeechPlaybackState,
    SpeechRequest,
    SpeechSegment
} from "./types";

/** Explicit engines for normal reading and spelling; providers can be freely combined. */
export interface SpeechEngineRouterOptions {
    readonly text: SpeechEngine;
    readonly spell?: SpeechEngine;
    readonly id?: string;
    /** Optional explicit per-segment routing for application-defined channels. Undefined means unavailable. */
    readonly selectEngine?: (segment: SpeechSegment) => SpeechEngine | undefined;
    /** Optional silence after a segment, in milliseconds (0-60000); omitted after the last segment. */
    readonly getPauseAfterMs?: (segment: SpeechSegment) => number;
}

interface SpeechGroup {
    readonly engine: SpeechEngine;
    readonly segments: SpeechSegment[];
    pauseAfterMs: number;
}

function capabilities(engine: SpeechEngine | undefined): SpeechEngineCapabilities {
    try {
        return engine?.getCapabilities() ?? { available: false, pause: false, spelling: false };
    } catch {
        return { available: false, pause: false, spelling: false };
    }
}

function createRoutedPlayback(
    options: SpeechEngineRouterOptions,
    request: SpeechRequest
): { playback: SpeechPlayback; start(): void } {
    const groups: SpeechGroup[] = [];
    const listeners = new Set<SpeechPlaybackListener>();
    const rate = request.rate;
    const volume = request.volume;
    let state: SpeechPlaybackState = { status: "idle" };
    let child: SpeechPlayback | null = null;
    let unsubscribe: (() => void) | null = null;
    let index = 0;
    let revision = 0;
    let advancing = false;
    let initialFailure: SpeechPlaybackState | null = null;
    let pauseTimer: ReturnType<typeof setTimeout> | null = null;
    let pauseRemaining = 0;
    let pauseDeadline = 0;

    for (const segment of request.segments) {
        if (segment.mode === "spell" ? !segment.text : !segment.text.trim()) continue;
        const spelling = segment.mode === "spell";
        let engine: SpeechEngine | undefined;
        let pauseAfterMs = 0;
        try {
            engine = options.selectEngine ? options.selectEngine(segment) : spelling ? options.spell : options.text;
            const duration = options.getPauseAfterMs?.(segment) ?? 0;
            if (Number.isFinite(duration)) pauseAfterMs = Math.max(0, Math.min(60000, duration));
        }
        catch { initialFailure = { status: "error", error: "speech-engine-routing-failed" }; break; }
        const supported = capabilities(engine);
        if (!engine || !supported.available || (spelling && !supported.spelling)) {
            initialFailure = { status: "unavailable" };
            break;
        }
        const last = groups[groups.length - 1];
        const copy = { ...segment };
        if (last?.engine === engine && last.pauseAfterMs === 0) {
            last.segments.push(copy);
            last.pauseAfterMs = pauseAfterMs;
        } else groups.push({ engine, segments: [copy], pauseAfterMs });
    }

    function notify(): void {
        listeners.forEach((listener) => listener(state));
    }

    function detach(): SpeechPlayback | null {
        revision += 1;
        unsubscribe?.();
        unsubscribe = null;
        const previous = child;
        child = null;
        return previous;
    }

    function finish(next: SpeechPlaybackState): void {
        state = { ...next };
        if (pauseTimer !== null) clearTimeout(pauseTimer);
        pauseTimer = null;
        pauseRemaining = 0;
        const previous = detach();
        try { previous?.stop(); } catch { /* The routed state still settles if a provider cannot stop. */ }
        notify();
    }

    function continueAfterPause(): void {
        if (state.status !== "speaking") return;
        if (pauseRemaining === 0) { advance(); return; }
        pauseDeadline = Date.now() + pauseRemaining;
        pauseTimer = setTimeout(() => {
            pauseTimer = null;
            pauseRemaining = 0;
            advance();
        }, pauseRemaining);
    }

    function advance(): void {
        if (advancing) return;
        advancing = true;
        try {
            // Synchronously completed providers must not recurse once per group.
            while (state.status === "speaking" && child === null && pauseRemaining === 0) {
                const group = groups[index];
                if (!group) { finish({ status: "completed" }); break; }
                try {
                    const ticket = ++revision;
                    const current = group.engine.speak({
                        segments: group.segments,
                        ...(rate === undefined ? {} : { rate }),
                        ...(volume === undefined ? {} : { volume })
                    });
                    if (ticket !== revision || state.status !== "speaking") {
                        current.stop();
                        break;
                    }
                    child = current;
                    const cleanup = current.subscribe((next) => {
                        if (ticket !== revision || child !== current) return;
                        if (next.status === "completed") {
                            detach();
                            index += 1;
                            pauseRemaining = index < groups.length ? group.pauseAfterMs : 0;
                            continueAfterPause();
                        } else if (next.status === "error" || next.status === "unavailable" || next.status === "idle") {
                            finish(next);
                        } else {
                            state = { ...next };
                            notify();
                        }
                    });
                    if (ticket === revision && child === current) unsubscribe = cleanup;
                    else cleanup();
                } catch {
                    finish({ status: "error", error: "speech-engine-routing-failed" });
                    break;
                }
            }
        } finally {
            advancing = false;
        }
    }

    const playback: SpeechPlayback = {
        getState: () => state,
        pause(): void {
            if (state.status !== "speaking") return;
            if (child === null && pauseRemaining > 0) {
                if (pauseTimer !== null) {
                    clearTimeout(pauseTimer);
                    pauseTimer = null;
                    pauseRemaining = Math.max(0, pauseDeadline - Date.now());
                }
                state = { status: "paused" };
                notify();
                return;
            }
            try { child?.pause(); } catch { finish({ status: "error", error: "speech-engine-routing-failed" }); }
        },
        resume(): void {
            if (state.status !== "paused") return;
            try {
                if (child) child.resume();
                else { state = { status: "speaking" }; notify(); continueAfterPause(); }
            } catch { finish({ status: "error", error: "speech-engine-routing-failed" }); }
        },
        stop(): void {
            if (state.status === "speaking" || state.status === "paused") finish({ status: "idle" });
        },
        subscribe(listener): () => void {
            listeners.add(listener);
            listener(state);
            return () => { listeners.delete(listener); };
        }
    };

    return {
        playback,
        start(): void {
            if (initialFailure) { finish(initialFailure); return; }
            state = { status: "speaking" };
            advance();
        }
    };
}

/**
 * Routes text and spelling explicitly while preserving request order and owned playback.
 * A missing route is unavailable, not an implicit fallback to another mode/provider.
 */
export function createSpeechEngineRouter(options: SpeechEngineRouterOptions): SpeechEngine {
    let active: SpeechPlayback | null = null;
    let revision = 0;
    return {
        id: options.id ?? "routed-speech",
        getCapabilities(): SpeechEngineCapabilities {
            const text = capabilities(options.text);
            const spell = capabilities(options.spell);
            return {
                available: text.available,
                pause: text.available && text.pause && (!spell.available || spell.pause),
                spelling: text.available && spell.available && spell.spelling
            };
        },
        speak(request): SpeechPlayback {
            const ticket = ++revision;
            const previous = active;
            active = null;
            previous?.stop();
            const current = createRoutedPlayback(options, ticket === revision ? request : { segments: [] });
            if (ticket === revision) {
                active = current.playback;
                current.start();
            }
            return current.playback;
        },
        stop(): void {
            revision += 1;
            const previous = active;
            active = null;
            previous?.stop();
        }
    };
}
