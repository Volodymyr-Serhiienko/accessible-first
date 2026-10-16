import {
    ActionsBar,
    type ActionsBarAlign,
    type ComposedActionsBar
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
import { runCleanups } from "../../../core/src/events";
import { isFocusable } from "../../../core/src/focus";
import { createSpeechPlaybackOwner } from "./createSpeechPlaybackOwner";
import type {
    SpeechEngine,
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
    isDestroyed(): boolean;
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
    let destroyed = false;
    let playback!: ReturnType<typeof createSpeechPlaybackOwner>;
    let statusMessage!: ComposedStatusMessage;
    let startButton!: ComposedButton;
    let pauseButton!: ComposedButton;
    let stopButton!: ComposedButton;
    let actions!: ComposedActionsBar;
    let stack!: ComposedNode;

    function showStatus(
        variant: "info" | "danger",
        text: string | null | undefined,
        isCurrent: () => boolean
    ): void {
        if (destroyed) return;
        const message = getText(text);

        if (!message || !isCurrent()) return;

        statusMessage.update({
            variant,
            text: message,
            icon: variant === "danger" ? "!" : "i",
            hidden: false,
            announcement: true
        });
    }

    function syncPlayback(state: SpeechPlaybackState, isCurrent: () => boolean): void {
        if (destroyed) return;
        const canPause = options.engine.getCapabilities().pause;
        if (destroyed || !isCurrent()) return;
        const focused = pauseButton.element.ownerDocument.activeElement;
        const losingFocus = !isActive(state) && (focused === pauseButton.element || focused === stopButton.element)
            || !canPause && focused === pauseButton.element;
        pauseButton.update({
            text: state.status === "paused"
                ? options.resumeText
                : options.pauseText,
            disabled: !isActive(state) || !canPause
        });
        if (destroyed || !isCurrent()) return;

        stopButton.update({
            disabled: !isActive(state)
        });
        if (destroyed || !isCurrent()) return;

        const active = startButton.element.ownerDocument.activeElement;
        if (losingFocus && (active === focused || active === startButton.element.ownerDocument.body) && isFocusable(startButton.element)) {
            startButton.element.focus({ preventScroll: true });
        }

        if (state.status === "unavailable") {
            showStatus("danger", options.unavailableText, isCurrent);
        }

        if (state.status === "error") {
            showStatus("danger", options.failedText, isCurrent);
        }
        if (state.status !== "unavailable" && state.status !== "error" && state.status !== "paused") statusMessage.hide();
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        runCleanups([
            () => playback?.destroy(),
            () => stack ? stack.destroy?.() : runCleanups([
                () => actions ? actions.destroy() : runCleanups([
                    () => startButton?.destroy(), () => pauseButton?.destroy(), () => stopButton?.destroy()
                ]),
                () => statusMessage?.destroy()
            ])
        ]);
    }

    try {
        statusMessage = StatusMessage({ hidden: true });
        startButton = Button({
            text: options.startText,
            onPress: () => {
                play();
            }
        });

        pauseButton = Button({
            text: options.pauseText,
            reserveText: [options.pauseText, options.resumeText],
            disabled: true,
            onPress: () => {
                const state = playback.getState();

                if (state.status === "paused") {
                    resume();
                    return;
                }

                pause();
            }
        });

        stopButton = Button({
            text: options.stopText,
            disabled: true,
            onPress: () => {
                stop();
            }
        });

        actions = ActionsBar({
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

        stack = Stack(
            stackOptions,
            actions,
            statusMessage
        );

        playback = createSpeechPlaybackOwner(options.engine, syncPlayback);

        function play(): void {
            if (destroyed) return;
            statusMessage.hide();
            playback.play(request);
        }

        function pause(): void {
            if (destroyed) return;
            const revision = playback.getRevision();
            if (playback.pause()) showStatus("info", options.pausedText, () => !destroyed && revision === playback.getRevision());
        }

        function resume(): void {
            if (!destroyed) playback.resume();
        }

        function stop(): void {
            if (destroyed || !playback.stop()) return;
            const revision = playback.getRevision();
            showStatus("info", options.stoppedText, () => !destroyed && revision === playback.getRevision());
        }

        function setRequest(nextRequest: SpeechRequest): void {
            if (destroyed) return;
            request = nextRequest;
            statusMessage.hide();
            playback.reset();
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
            destroy,
            isDestroyed: () => destroyed
        };
    } catch (error) {
        try { destroy(); } catch { /* Preserve the construction failure. */ }
        throw error;
    }
}
