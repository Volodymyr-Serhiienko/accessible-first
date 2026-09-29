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
    let completedBeforeSubscription = false;

    const complete = (): void => {
        if (completed) return;

        completed = true;
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        } else {
            completedBeforeSubscription = true;
        }
        onComplete();
    };

    unsubscribe = playback.subscribe((state) => {
        if (matches(state)) complete();
    });

    if (completedBeforeSubscription) {
        unsubscribe();
        unsubscribe = null;
    }

    return () => {
        completed = true;
        unsubscribe?.();
        unsubscribe = null;
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
