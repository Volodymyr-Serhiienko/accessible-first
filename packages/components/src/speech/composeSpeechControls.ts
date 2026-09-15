import {
    ActionsBar,
    type ActionsBarAlign
} from "../actions-bar";
import {
    Button,
    type ComposedButton
} from "../button";
import {
    Stack,
    type BaseCompositionOptions,
    type ComposedNode
} from "../composition";
import {
    StatusMessage,
    type ComposedStatusMessage
} from "../status-message";
import type {
    SpeechEngine,
    SpeechPlayback,
    SpeechPlaybackState,
    SpeechRequest
} from "../../../core/src/speech";

/** Options for SpeechControls(). */
export interface SpeechControlsOptions extends BaseCompositionOptions {
    /** Engine that owns playback. */
    engine: SpeechEngine;
    /** Initial request played by the start control. */
    request: SpeechRequest;
    /** Accessible group name for the related speech actions. */
    label: string;
    /** Visible start action text. */
    startText: string;
    /** Visible pause action text. */
    pauseText: string;
    /** Visible resume action text shown after a pause. */
    resumeText: string;
    /** Visible stop action text. */
    stopText: string;
    /** Optional visible and spoken text after pause. */
    pausedText?: string | null;
    /** Optional visible and spoken text after stop. */
    stoppedText?: string | null;
    /** Optional visible and spoken text when speech is unavailable. */
    unavailableText?: string | null;
    /** Optional visible and spoken text when playback fails. */
    failedText?: string | null;
    /** Alignment for the action row. Defaults to start. */
    align?: ActionsBarAlign;
    /** Lets actions fill wrapped rows. Defaults to true. */
    fillOnWrap?: boolean;
}

/** Speech controls created by the composition API. */
export interface ComposedSpeechControls extends ComposedNode<HTMLElement> {
    readonly startButton: ComposedButton;
    readonly pauseButton: ComposedButton;
    readonly stopButton: ComposedButton;
    readonly statusMessage: ComposedStatusMessage;
    play(): void;
    pause(): void;
    resume(): void;
    stop(): void;
    setRequest(request: SpeechRequest): void;
    destroy(): void;
}

function isActive(state: SpeechPlaybackState): boolean {
    return state.status === "speaking" || state.status === "paused";
}

function getText(value: string | null | undefined): string | null {
    const text = value?.trim() ?? "";

    return text || null;
}

/**
 * Creates accessible start, pause/resume, and stop controls for one speech
 * request. All user-facing text is supplied by the application.
 */
export function SpeechControls(options: SpeechControlsOptions): ComposedSpeechControls {
    let request = options.request;
    let playback: SpeechPlayback | null = null;
    let unsubscribe: (() => void) | null = null;

    const statusMessage = StatusMessage({ hidden: true });

    function showStatus(
        variant: "info" | "danger",
        text: string | null | undefined
    ): void {
        const message = getText(text);

        if (!message) return;

        statusMessage.update({
            variant,
            text: message,
            icon: variant === "danger" ? "!" : "i",
            hidden: false,
            announcement: true
        });
    }

    function clearPlayback(stop = false): void {
        unsubscribe?.();
        unsubscribe = null;

        if (stop) {
            playback?.stop();
        }

        playback = null;
    }

    function syncPlayback(state: SpeechPlaybackState): void {
        pauseButton.update({
            text: state.status === "paused"
                ? options.resumeText
                : options.pauseText,
            disabled: !isActive(state)
        });

        stopButton.update({
            disabled: !isActive(state)
        });

        if (state.status === "unavailable") {
            showStatus("danger", options.unavailableText);
        }

        if (state.status === "error") {
            showStatus("danger", options.failedText);
        }
    }

    const startButton = Button({
        text: options.startText,
        onPress: () => {
            play();
        }
    });

    const pauseButton = Button({
        text: options.pauseText,
        disabled: true,
        onPress: () => {
            const state = playback?.getState();

            if (!playback || !state) return;

            if (state.status === "paused") {
                resume();
                return;
            }

            pause();
        }
    });

    const stopButton = Button({
        text: options.stopText,
        disabled: true,
        onPress: () => {
            stop();
        }
    });

    const actions = ActionsBar({
        label: options.label,
        align: options.align ?? "start",
        fillOnWrap: options.fillOnWrap ?? true,
        primary: [startButton, pauseButton, stopButton]
    });

    const stackOptions: BaseCompositionOptions = {
        attributes: {
            ...options.attributes,
            "data-af-composition": "speech-controls"
        }
    };

    if (options.id !== undefined) stackOptions.id = options.id;
    if (options.className !== undefined) stackOptions.className = options.className;

    const stack = Stack(
        stackOptions,
        actions,
        statusMessage
    );

    function play(): void {
        clearPlayback(true);
        statusMessage.hide();

        playback = options.engine.speak(request);
        unsubscribe = playback.subscribe(syncPlayback);
    }

    function pause(): void {
        if (!playback || playback.getState().status !== "speaking") {
            return;
        }

        playback.pause();
        showStatus("info", options.pausedText);
    }

    function resume(): void {
        if (!playback || playback.getState().status !== "paused") {
            return;
        }

        statusMessage.hide();
        playback.resume();
    }

    function stop(): void {
        if (!playback || !isActive(playback.getState())) {
            return;
        }

        playback.stop();
        showStatus("info", options.stoppedText);
    }

    function setRequest(nextRequest: SpeechRequest): void {
        request = nextRequest;
        clearPlayback(true);
        statusMessage.hide();
        syncPlayback({ status: "idle" });
    }

    return {
        element: stack.element,
        startButton,
        pauseButton,
        stopButton,
        statusMessage,
        play,
        pause,
        resume,
        stop,
        setRequest,

        destroy(): void {
            clearPlayback(true);
            actions.destroy();
            statusMessage.destroy();
        }
    };
}
