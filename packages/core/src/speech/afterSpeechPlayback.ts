import { runCleanups } from "../events";
import type {
    SpeechPlayback,
    SpeechPlaybackState
} from "./types";

type SpeechPlaybackStatePredicate = (state: SpeechPlaybackState) => boolean;

function afterSpeechState(
    playback: SpeechPlayback,
    matches: SpeechPlaybackStatePredicate,
    onComplete: () => void
): () => void {
    let unsubscribe: (() => void) | null = null;
    let completed = false;
    let subscribing = true;
    let pendingCompletion = false;

    const finish = (): void => {
        const previous = unsubscribe;
        unsubscribe = null;
        runCleanups([() => previous?.(), onComplete]);
    };

    const complete = (): void => {
        if (completed) return;

        completed = true;
        if (subscribing) pendingCompletion = true;
        else finish();
    };

    try {
        unsubscribe = playback.subscribe((state) => {
            if (matches(state)) complete();
        });
    } catch (error) {
        completed = true;
        throw error;
    }
    subscribing = false;

    if (pendingCompletion) finish();

    return () => {
        completed = true;
        const previous = unsubscribe;
        unsubscribe = null;
        previous?.();
    };
}

/** Runs work once after a speech request completes normally. */
export function afterSpeechCompletes(
    playback: SpeechPlayback,
    onComplete: () => void
): () => void {
    return afterSpeechState(
        playback,
        (state) => state.status === "completed",
        onComplete
    );
}

/**
 * Runs work once when speech completes, is stopped, is unavailable, or fails.
 * The returned cleanup prevents the follow-up when its owning view is removed.
 */
export function afterSpeechSettles(
    playback: SpeechPlayback,
    onComplete: () => void
): () => void {
    return afterSpeechState(
        playback,
        (state) => (
            state.status === "idle"
            || state.status === "completed"
            || state.status === "unavailable"
            || state.status === "error"
        ),
        onComplete
    );
}
