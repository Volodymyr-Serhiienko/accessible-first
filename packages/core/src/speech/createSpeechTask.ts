import { createTaskScope } from "../task";
import { afterSpeechSettles } from "./afterSpeechPlayback";
import type { SpeechEngine, SpeechPlayback, SpeechRequest } from "./types";

/** Follow-ups for one owned speech request; cancellation never invokes them. */
export interface SpeechTaskCallbacks {
    /** Called after normal completion, or after the optional-speech fallback. */
    onComplete?: () => void;
    /** Called when synthesis is unavailable or fails. */
    onFallback?: () => void;
}

/** Replaces speech and its follow-ups together, independently of the engine provider. */
export interface SpeechTask {
    /** Starts owned playback and cancels the preceding request. */
    speak(request: SpeechRequest, callbacks?: SpeechTaskCallbacks): void;
    /** Stops playback without running completion/fallback actions. */
    cancel(): void;
    /** Cancels playback and permanently disposes this controller. */
    destroy(): void;
}

/** Coordinates optional speech without leaving callbacks attached to a removed view. */
export function createSpeechTask(engine: SpeechEngine): SpeechTask {
    const scope = createTaskScope();
    let playback: SpeechPlayback | null = null;
    let disposed = false;
    function cancel(): void {
        scope.cancel();
        const previous = playback;
        playback = null;
        previous?.stop();
    }
    return {
        speak(request, callbacks = {}): void {
            if (disposed) return;
            cancel();
            const task = scope.begin();
            function fallback(): void {
                callbacks.onFallback?.();
                if (task.isCurrent()) callbacks.onComplete?.();
            }
            try {
                if (engine.getCapabilities().available) playback = engine.speak(request);
            }
            catch { fallback(); return; }
            if (!playback) { fallback(); return; }
            const current = playback;
            task.addCleanup(afterSpeechSettles(current, () => {
                if (!task.isCurrent()) return;
                const status = current.getState().status;
                if (status === "completed") callbacks.onComplete?.();
                else if (status === "error" || status === "unavailable") fallback();
            }));
        },
        cancel,
        destroy(): void { disposed = true; cancel(); scope.destroy(); }
    };
}
