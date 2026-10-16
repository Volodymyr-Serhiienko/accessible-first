import { runCleanups, type Cleanup } from "../../../core/src/events";
import type { SpeechEngine, SpeechPlayback, SpeechPlaybackState, SpeechRequest } from "../../../core/src/speech";

interface OwnedPlayback {
    playback: SpeechPlayback;
    revision: number;
    unsubscribe: Cleanup | null;
    released: boolean;
    lastState: SpeechPlaybackState | null;
}

/** @internal Terminal states shared by the composed speech controls. */
export function isSpeechPlaybackTerminal(state: SpeechPlaybackState): boolean {
    return state.status === "idle" || state.status === "completed"
        || state.status === "unavailable" || state.status === "error";
}

/** @internal Owns one widget's playback subscription, never the shared engine. */
export function createSpeechPlaybackOwner(
    engine: SpeechEngine,
    onState: (state: SpeechPlaybackState, isCurrent: () => boolean) => void,
    stopOnRelease = true
) {
    let current: OwnedPlayback | null = null;
    let state: SpeechPlaybackState = { status: "idle" };
    let revision = 0;
    let destroyed = false;

    function isCurrent(entry: OwnedPlayback): boolean {
        return !destroyed && !entry.released && current === entry && revision === entry.revision;
    }

    function release(entry: OwnedPlayback | null, stop: boolean): void {
        if (!entry || entry.released) return;
        entry.released = true;
        const unsubscribe = entry.unsubscribe;
        entry.unsubscribe = null;
        runCleanups([() => unsubscribe?.(), () => {
            if (stop && current?.playback !== entry.playback) entry.playback.stop();
        }]);
    }

    function receive(entry: OwnedPlayback, next: SpeechPlaybackState): void {
        if (!isCurrent(entry)) return;
        if (entry.lastState?.status === next.status && entry.lastState.error === next.error) return;
        entry.lastState = next;
        const activeRevision = revision;
        const publish = (): void => {
            if (destroyed || revision !== activeRevision) return;
            state = next;
            onState(next, () => !destroyed && revision === activeRevision);
        };
        if (isSpeechPlaybackTerminal(next)) {
            current = null;
            runCleanups([() => release(entry, false), publish]);
        } else publish();
    }

    function reportProviderFailure(activeRevision: number): void {
        if (destroyed || revision !== activeRevision) return;
        state = { status: "error" };
        onState(state, () => !destroyed && revision === activeRevision);
    }

    function watch(entry: OwnedPlayback): void {
        let subscribing = true;
        let pending: SpeechPlaybackState | null = null;
        let initial: SpeechPlaybackState;
        try {
            const unsubscribe = entry.playback.subscribe(next => {
                if (!isCurrent(entry)) return;
                if (subscribing) {
                    if (!pending || !isSpeechPlaybackTerminal(pending)) pending = next;
                } else receive(entry, next);
            });
            subscribing = false;
            if (!isCurrent(entry)) { unsubscribe(); return; }
            entry.unsubscribe = unsubscribe;
            initial = pending ?? entry.playback.getState();
        } catch (error) {
            subscribing = false;
            if (current === entry) current = null;
            try { release(entry, stopOnRelease); } catch { /* Preserve the provider/callback failure. */ }
            try { reportProviderFailure(entry.revision); } catch { /* Preserve the provider failure. */ }
            throw error;
        }
        receive(entry, initial);
    }

    function play(request: SpeechRequest): void {
        if (destroyed) return;
        const activeRevision = ++revision;
        const previous = current;
        current = null;
        runCleanups([
            () => release(previous, stopOnRelease),
            () => {
                if (destroyed || revision !== activeRevision) return;
                let playback: SpeechPlayback;
                try { playback = engine.speak(request); }
                catch (error) {
                    try { reportProviderFailure(activeRevision); } catch { /* Preserve the provider failure. */ }
                    throw error;
                }
                const entry: OwnedPlayback = { playback, revision: activeRevision, unsubscribe: null, released: false, lastState: null };
                if (destroyed || revision !== activeRevision) { release(entry, stopOnRelease); return; }
                current = entry;
                watch(entry);
            }
        ]);
    }

    function reset(): boolean {
        if (destroyed) return false;
        const activeRevision = ++revision;
        const previous = current;
        current = null;
        runCleanups([
            () => release(previous, stopOnRelease),
            () => {
                if (destroyed || revision !== activeRevision) return;
                state = { status: "idle" };
                onState(state, () => !destroyed && revision === activeRevision);
            }
        ]);
        return !destroyed && revision === activeRevision;
    }

    function change(action: "pause" | "resume"): boolean {
        const entry = current;
        const expected = action === "pause" ? "speaking" : "paused";
        if (!entry || !isCurrent(entry) || state.status !== expected) return false;
        if (!engine.getCapabilities().pause || !isCurrent(entry)) return false;
        entry.playback[action]();
        if (!isCurrent(entry)) return false;
        receive(entry, entry.playback.getState());
        return isCurrent(entry) && state.status === (action === "pause" ? "paused" : "speaking");
    }

    return {
        play,
        pause: () => change("pause"),
        resume: () => change("resume"),
        stop(): boolean { return current !== null && reset(); },
        reset,
        getState: () => state,
        getRevision: () => revision,
        isDestroyed: () => destroyed,
        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            revision += 1;
            const previous = current;
            current = null;
            release(previous, stopOnRelease);
        }
    };
}
