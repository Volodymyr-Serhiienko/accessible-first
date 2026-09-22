import {
    Button,
    type ButtonCompositionOptions,
    type ComposedButton
} from "../button";
import type { ComposedNode } from "../composition";
import type {
    SpeechEngine,
    SpeechPlayback,
    SpeechPlaybackState,
    SpeechRequest
} from "../../../core/src/speech";

/** Options for SpeechToggleButton(). */
export interface SpeechToggleButtonOptions extends Omit<
    ButtonCompositionOptions,
    "children" | "onPress" | "reserveText" | "text"
> {
    /** Engine that owns playback. */
    engine: SpeechEngine;
    /** Request played when the control starts. */
    request: SpeechRequest;
    /** Visible action before playback begins or after it completes. */
    startText: string;
    /** Visible action while playback is active. */
    pauseText: string;
    /** Visible action while playback is paused. */
    resumeText: string;
    /** Receives an unavailable playback state. */
    onUnavailable?: () => void;
    /** Receives a failed playback state. */
    onFailure?: () => void;
}

/** A compact single-button speech control. */
export interface ComposedSpeechToggleButton extends ComposedNode<HTMLButtonElement> {
    readonly button: ComposedButton;
    play(): void;
    pause(): void;
    resume(): void;
    setRequest(request: SpeechRequest): void;
    destroy(): void;
}

function isActive(state: SpeechPlaybackState): boolean {
    return state.status === "speaking" || state.status === "paused";
}

function isTerminal(state: SpeechPlaybackState): boolean {
    return (
        state.status === "idle"
        || state.status === "completed"
        || state.status === "unavailable"
        || state.status === "error"
    );
}

/**
 * Creates one localized button that starts, pauses, and resumes a speech
 * request. Applications decide how unavailable or failed playback is presented.
 */
export function SpeechToggleButton(
    options: SpeechToggleButtonOptions
): ComposedSpeechToggleButton {
    const {
        engine,
        request: initialRequest,
        startText,
        pauseText,
        resumeText,
        onUnavailable,
        onFailure,
        ...buttonOptions
    } = options;
    let request = initialRequest;
    let playback: SpeechPlayback | null = null;
    let unsubscribe: (() => void) | null = null;

    function clearSubscription(): void {
        unsubscribe?.();
        unsubscribe = null;
    }

    function clearPlayback(stop = false): void {
        const currentPlayback = playback;

        clearSubscription();
        playback = null;

        if (stop) currentPlayback?.stop();
    }

    function syncButton(state: SpeechPlaybackState): void {
        if (state.status === "speaking") {
            button.setText(pauseText);
            return;
        }

        if (state.status === "paused") {
            button.setText(resumeText);
            return;
        }

        button.setText(startText);
    }

    function watchPlayback(nextPlayback: SpeechPlayback): void {
        let completedBeforeSubscription = false;
        let reportedUnavailable = false;
        let reportedFailure = false;

        const handleState = (state: SpeechPlaybackState): void => {
            syncButton(state);

            if (state.status === "unavailable" && !reportedUnavailable) {
                reportedUnavailable = true;
                onUnavailable?.();
            }

            if (state.status === "error" && !reportedFailure) {
                reportedFailure = true;
                onFailure?.();
            }

            if (!isTerminal(state)) return;

            if (unsubscribe) {
                clearSubscription();
            } else {
                completedBeforeSubscription = true;
            }
        };

        unsubscribe = nextPlayback.subscribe(handleState);

        if (completedBeforeSubscription) {
            clearSubscription();
        }
    }

    function play(): void {
        clearPlayback(true);

        playback = engine.speak(request);
        watchPlayback(playback);
    }

    function pause(): void {
        if (!playback || playback.getState().status !== "speaking") return;

        playback.pause();
    }

    function resume(): void {
        if (!playback || playback.getState().status !== "paused") return;

        playback.resume();
    }

    const button = Button({
        ...buttonOptions,
        text: startText,
        reserveText: [startText, pauseText, resumeText],
        onPress: () => {
            const state = playback?.getState();

            if (!state || isTerminal(state)) {
                play();
                return;
            }

            if (state.status === "paused") {
                resume();
                return;
            }

            if (isActive(state)) pause();
        }
    });

    button.element.setAttribute("data-af-speech-toggle-button", "");

    return {
        element: button.element,
        button,
        play,
        pause,
        resume,

        setRequest(nextRequest): void {
            request = nextRequest;
            clearPlayback(true);
            button.setText(startText);
        },

        destroy(): void {
            clearPlayback(true);
            button.destroy();
        }
    };
}
