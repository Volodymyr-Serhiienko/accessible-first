import {
    Button,
    type ButtonCompositionOptions,
    type ComposedButton
} from "../button";
import type { ComposedNode } from "../composition";
import { runCleanups } from "../../../core/src/events";
import { createSpeechPlaybackOwner, isSpeechPlaybackTerminal } from "./createSpeechPlaybackOwner";
import type {
    SpeechEngine,
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
    isDestroyed(): boolean;
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
    let destroyed = false;
    const playback = createSpeechPlaybackOwner(engine, (state, isCurrent) => {
        if (destroyed || !isCurrent()) return;
        const canPause = engine.getCapabilities().pause;
        if (destroyed || !isCurrent()) return;
        button.setText(canPause && state.status === "speaking" ? pauseText
            : canPause && state.status === "paused" ? resumeText : startText);
        if (destroyed || !isCurrent()) return;
        if (state.status === "unavailable") onUnavailable?.();
        else if (state.status === "error") onFailure?.();
    });

    function play(): void {
        if (!destroyed) playback.play(request);
    }

    function pause(): void {
        if (!destroyed) playback.pause();
    }

    function resume(): void {
        if (!destroyed) playback.resume();
    }

    const button = Button({
        ...buttonOptions,
        text: startText,
        reserveText: [startText, pauseText, resumeText],
        onPress: () => {
            const state = playback.getState();
            const revision = playback.getRevision();
            const canPause = isSpeechPlaybackTerminal(state) || engine.getCapabilities().pause;
            if (destroyed || revision !== playback.getRevision()) return;

            if (isSpeechPlaybackTerminal(state) || !canPause) {
                play();
                return;
            }

            if (state.status === "paused") {
                resume();
                return;
            }

            pause();
        }
    });

    button.element.setAttribute("data-af-speech-toggle-button", "");

    return {
        element: button.element,
        button,
        play,
        pause,
        resume,
        isDestroyed: () => destroyed,

        setRequest(nextRequest): void {
            if (destroyed) return;
            request = nextRequest;
            playback.reset();
        },

        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            runCleanups([playback.destroy, button.destroy]);
        }
    };
}
