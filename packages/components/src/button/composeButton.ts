import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type CompositionChild
} from "../composition";
import { createButton } from "./createButton";
import {
    createControlHint,
    createSelectedState,
    type ControlHintDisplay,
    type ControlHintOptions,
    type SelectedStateOptions
} from "../foundation";
import type { Button as ButtonInstance, ButtonOptions } from "./types";

/**
 * Called when the composed button is activated.
 * Receives the native event and the composed button instance.
 */
export type ButtonCompositionOnPress = (
    event: Event,
    button: ComposedButton
) => void;

/** Text, or text candidates, used to reserve space for a changing button label. */
export type ButtonReservedText = string | readonly string[] | null;

/**
 * Options for Button(), the composition API that creates and enhances a native button.
 * Use `text` for simple labels or `children` for richer content.
 */
export interface ButtonCompositionOptions
    extends Omit<ButtonOptions, "onPress">,
        BaseCompositionOptions {
    text?: string;
    children?: CompositionChild[];
    reserveText?: ButtonReservedText;
    selected?: boolean;
    hint?: string | null;
    hintId?: string;
    hintDisplay?: ControlHintDisplay;
    hintAnnounceOnHover?: boolean;
    onPress?: ButtonCompositionOnPress | null;
}

/**
 * Options accepted by ComposedButton.update().
 */
export interface ButtonCompositionUpdateOptions extends Partial<ButtonCompositionOptions> {}

/**
 * A button created by Button().
 * Includes the enhanced button behavior plus content and lifecycle helpers.
 */
export interface ComposedButton extends Omit<ButtonInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLButtonElement;
    setText(text: string): void;
    setSelected(selected: boolean): void;
    isSelected(): boolean;
    toggleSelected(force?: boolean): boolean;
    setHint(hint: string | null): void;
    update(options: ButtonCompositionUpdateOptions): void;
    destroy(): void;
}

function getControlHintOptions(
    options: ButtonCompositionUpdateOptions
): ControlHintOptions {
    const hintOptions: ControlHintOptions = {};

    if ("hint" in options) hintOptions.hint = options.hint ?? null;
    if (options.hintId !== undefined) hintOptions.hintId = options.hintId;
    if (options.hintDisplay !== undefined) hintOptions.hintDisplay = options.hintDisplay;
    if (options.hintAnnounceOnHover !== undefined) {
        hintOptions.hintAnnounceOnHover = options.hintAnnounceOnHover;
    }

    return hintOptions;
}

function getChildren(options: ButtonCompositionOptions): CompositionChild[] {
    if (options.children !== undefined) return options.children;
    if (options.text !== undefined) return [options.text];
    return [];
}

function getReservedText(value: ButtonReservedText | undefined): string | null {
    const candidates = typeof value === "string"
        ? [value]
        : value ?? [];
    let reservedText = "";

    for (const candidate of candidates) {
        const text = candidate.trim();

        if (Array.from(text).length > Array.from(reservedText).length) {
            reservedText = text;
        }
    }

    return reservedText || null;
}

function getButtonOptions(
    options: ButtonCompositionUpdateOptions,
    onPress?: (event: Event) => void
): ButtonOptions {
    const buttonOptions: ButtonOptions = {};

    if (onPress !== undefined) buttonOptions.onPress = onPress;

    if (options.disabled !== undefined) buttonOptions.disabled = options.disabled;
    if ("pressed" in options) buttonOptions.pressed = options.pressed ?? null;
    if (options.type !== undefined) buttonOptions.type = options.type;
    if (options.variant !== undefined) buttonOptions.variant = options.variant;
    if (options.size !== undefined) buttonOptions.size = options.size;

    return buttonOptions;
}

function getSelectedStateOptions(
    options: Pick<ButtonCompositionOptions, "selected">
): SelectedStateOptions {
    const selectedOptions: SelectedStateOptions = {};

    if (options.selected !== undefined) {
        selectedOptions.selected = options.selected;
    }

    return selectedOptions;
}

/**
 * Creates an accessible button with default styling hooks and optional composed content.
 */
export function Button(options: ButtonCompositionOptions = {}): ComposedButton {
    const element = createElement("button", getCompositionElementOptions(options));
    const contentElement = createElement("span", {
        attributes: {
            "data-af-button-content": ""
        }
    });
    const content = createContentSlot(contentElement, getChildren(options));
    const selectedState = createSelectedState(element, getSelectedStateOptions(options));

    element.append(contentElement);

    let composed!: ComposedButton;
    let onPress = options.onPress ?? null;
    let reservedText = getReservedText(options.reserveText);

    function syncReservedText(): void {
        if (reservedText === null) {
            element.removeAttribute("data-af-button-reserved-text");
            return;
        }

        element.setAttribute("data-af-button-reserved-text", reservedText);
    }

    function handlePress(event: Event): void {
        onPress?.(event, composed);
    }

    const button = createButton(
        element,
        getButtonOptions(options, handlePress)
    );

    const controlHint = createControlHint(element, getControlHintOptions(options));

    syncReservedText();

    function setText(text: string): void {
        content.set([text]);
        controlHint.refresh();
    }

    composed = {
        ...button,
        element,
        setText,
        setSelected: selectedState.setSelected,
        isSelected: selectedState.isSelected,
        toggleSelected: selectedState.toggleSelected,
        setHint: controlHint.setHint,

        update(nextOptions: ButtonCompositionUpdateOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("onPress" in nextOptions) {
                onPress = nextOptions.onPress ?? null;
            }

            if (nextOptions.selected !== undefined) {
                selectedState.setSelected(nextOptions.selected);
            }

            if ("reserveText" in nextOptions) {
                reservedText = getReservedText(nextOptions.reserveText);
                syncReservedText();
            }

            button.update(getButtonOptions(nextOptions));

            if (nextOptions.children !== undefined) {
                content.set(nextOptions.children);
            } else if (nextOptions.text !== undefined) {
                setText(nextOptions.text);
            }

            controlHint.update(getControlHintOptions(nextOptions));
            controlHint.refresh();
        },

        destroy(): void {
            content.dispose();
            selectedState.destroy();
            controlHint.destroy();
            button.destroy();
        }
    };

    return composed;
}


