import {
    IconButton,
    type ComposedIconButton,
    type IconButtonCompositionOptions
} from "../icon-button";
import type {
    ComposedNode,
    CompositionChild
} from "../composition";
import { Icon } from "../composition";
import type {
    SpeechEngine,
    SpeechPlayback,
    SpeechPlaybackState,
    SpeechRequest
} from "../../../core/src/speech";

const speakerIconPath =
    "M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.25-3.9v7.8A4.5 4.5 0 0 0 16.5 12zm0-7.5v2.1a7.5 7.5 0 0 1 0 10.8v2.1a9.6 9.6 0 0 0 0-17.1z";

/** Options for SpeechButton(). */
export interface SpeechButtonOptions extends Omit<
    IconButtonCompositionOptions,
    "children" | "icon" | "label" | "onPress"
> {
    /** Engine that owns playback. */
    engine: SpeechEngine;
    /** Request played when the button is pressed. */
    request: SpeechRequest;
    /** Accessible name for the button. */
    label: string;
    /** Optional replacement for the default speaker icon. */
    icon?: CompositionChild;
    /** Receives an unavailable playback state. */
    onUnavailable?: () => void;
    /** Receives a failed playback state. */
    onFailure?: () => void;
}

/** Compact speech action created by the composition API. */
export interface ComposedSpeechButton extends ComposedNode<HTMLButtonElement> {
    readonly button: ComposedIconButton;
    play(): void;
    destroy(): void;
}

function isFinished(state: SpeechPlaybackState): boolean {
    return (
        state.status === "idle"
        || state.status === "completed"
        || state.status === "unavailable"
        || state.status === "error"
    );
}

/**
 * Creates an icon-only speech action with a default speaker icon.
 * Applications decide how unavailable or failed playback is presented.
 */
export function SpeechButton(options: SpeechButtonOptions): ComposedSpeechButton {
    const {
        engine,
        request,
        label,
        icon,
        onUnavailable,
        onFailure,
        ...iconButtonOptions
    } = options;
    let unsubscribe: (() => void) | null = null;

    function clearSubscription(): void {
        unsubscribe?.();
        unsubscribe = null;
    }

    function watchPlayback(playback: SpeechPlayback): void {
        let finishedBeforeSubscription = false;

        const handleState = (state: SpeechPlaybackState): void => {
            if (!isFinished(state)) {
                return;
            }

            if (state.status === "unavailable") {
                onUnavailable?.();
            }

            if (state.status === "error") {
                onFailure?.();
            }

            if (unsubscribe) {
                clearSubscription();
            } else {
                finishedBeforeSubscription = true;
            }
        };

        unsubscribe = playback.subscribe(handleState);

        if (finishedBeforeSubscription) {
            clearSubscription();
        }
    }

    function play(): void {
        clearSubscription();
        watchPlayback(engine.speak(request));
    }

    const button = IconButton({
        ...iconButtonOptions,
        label,
        icon: icon ?? Icon({
            path: speakerIconPath,
            variant: "outline",
            size: "1.1rem"
        }),
        onPress: () => {
            play();
        }
    });

    button.element.setAttribute("data-af-speech-button", "");

    return {
        element: button.element,
        button,
        play,

        destroy(): void {
            clearSubscription();
            button.destroy();
        }
    };
}
