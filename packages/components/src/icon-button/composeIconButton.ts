import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type CompositionChild
} from "../composition";
import { createIconButton } from "./createIconButton";
import { restoreAttribute } from "../../../core/src/dom";
import {
    createControlHint,
    createSelectedState,
    type ControlHintDisplay,
    type ControlHintOptions,
    type SelectedStateOptions
} from "../foundation";

import type { IconButton as IconButtonInstance, IconButtonOptions } from "./types";

/**
 * Called when the composed icon button is activated.
 * Receives the native event and the composed icon button instance.
 */
export type IconButtonCompositionOnPress = (
    event: Event,
    button: ComposedIconButton
) => void;

/**
 * Options for IconButton(), the composition API for icon-only actions.
 * Always provide `label` or `labelledBy` unless the visible children already create a clear name.
 */
export interface IconButtonCompositionOptions
    extends Omit<IconButtonOptions, "onPress">,
        BaseCompositionOptions {
    icon?: CompositionChild;
    children?: CompositionChild[];
    title?: string | null;
    hint?: string | null;
    hintId?: string;
    hintDisplay?: ControlHintDisplay;
    hintAnnounceOnHover?: boolean;
    tooltip?: string | null;
    announceOnHover?: boolean;
    selected?: boolean;
    onPress?: IconButtonCompositionOnPress | null;
}

/**
 * An icon button created by IconButton().
 * Includes accessible-name controls, pressed state, content updates, and cleanup.
 */
export interface ComposedIconButton extends Omit<IconButtonInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLButtonElement;
    setTitle(title: string | null): void;
    setHint(hint: string | null): void;
    setTooltip(tooltip: string | null): void;
    setSelected(selected: boolean): void;
    isSelected(): boolean;
    toggleSelected(force?: boolean): boolean;
    update(options: Partial<IconButtonCompositionOptions>): void;
    destroy(): void;
}

function getChildren(options: IconButtonCompositionOptions): CompositionChild[] {
    if (options.children !== undefined) {
        return options.children;
    }

    if (options.icon !== undefined) {
        return [options.icon];
    }

    return [];
}

function getInitialControlHintOptions(
    options: IconButtonCompositionOptions
): ControlHintOptions {
    const hintOptions: ControlHintOptions = {};

    if ("hint" in options) {
        hintOptions.hint = options.hint ?? null;
    } else if ("tooltip" in options) {
        hintOptions.hint = options.tooltip ?? null;
    } else {
        hintOptions.hint = options.label ?? null;
    }

    if (options.hintId !== undefined) {
        hintOptions.hintId = options.hintId;
    }

    if (options.hintDisplay !== undefined) {
        hintOptions.hintDisplay = options.hintDisplay;
    } else if ("hint" in options) {
        hintOptions.hintDisplay = "description";
    } else if ("tooltip" in options) {
        hintOptions.hintDisplay = options.tooltip === null ? "none" : "tooltip";
    } else {
        hintOptions.hintDisplay = "tooltip";
    }

    hintOptions.hintAnnounceOnHover =
        options.hintAnnounceOnHover ?? options.announceOnHover ?? true;

    return hintOptions;
}

function getIconButtonOptions(
    options: Partial<IconButtonCompositionOptions>,
    onPress: (event: Event) => void
): IconButtonOptions {
    const iconButtonOptions: IconButtonOptions = {
        onPress
    };

    if ("label" in options) {
        iconButtonOptions.label = options.label ?? null;
    }

    if ("labelledBy" in options) {
        iconButtonOptions.labelledBy = options.labelledBy ?? null;
    }

    if (options.disabled !== undefined) {
        iconButtonOptions.disabled = options.disabled;
    }

    if ("pressed" in options) {
        iconButtonOptions.pressed = options.pressed ?? null;
    }

    if (options.type !== undefined) {
        iconButtonOptions.type = options.type;
    }

    if (options.variant !== undefined) {
        iconButtonOptions.variant = options.variant;
    }

    if (options.size !== undefined) {
        iconButtonOptions.size = options.size;
    }

    return iconButtonOptions;
}

function getSelectedStateOptions(
    options: Pick<IconButtonCompositionOptions, "selected">
): SelectedStateOptions {
    const selectedOptions: SelectedStateOptions = {};

    if (options.selected !== undefined) {
        selectedOptions.selected = options.selected;
    }

    return selectedOptions;
}

/**
 * Creates an accessible icon-only button with default styling hooks.
 */
export function IconButton(options: IconButtonCompositionOptions = {}): ComposedIconButton {
    const element = createElement("button", getCompositionElementOptions(options));
    const content = createContentSlot(element, getChildren(options));
    const selectedState = createSelectedState(element, getSelectedStateOptions(options));

    let composed!: ComposedIconButton;
    let onPress = options.onPress ?? null;

    const handlePress = (event: Event): void => {
        onPress?.(event, composed);
    };

    const iconButton = createIconButton(
        element,
        getIconButtonOptions(options, handlePress)
    );

    let hintFollowsLabel = options.hint === undefined && options.tooltip === undefined;

    const controlHint = createControlHint(element, getInitialControlHintOptions(options));

    const originalTitle = element.getAttribute("title");

    function applyTitle(title: string | null): void {
        if (title === null) {
            element.removeAttribute("title");
            return;
        }

        element.title = title;
    }

    if ("title" in options) {
        applyTitle(options.title ?? null);
    }

    function setTitle(title: string | null): void {
        applyTitle(title);
    }

    function setHint(nextHint: string | null): void {
        hintFollowsLabel = false;
        controlHint.setHint(nextHint);
        controlHint.refresh();
    }

    function setTooltip(nextTooltip: string | null): void {
        hintFollowsLabel = false;
        controlHint.update({
            hint: nextTooltip,
            hintDisplay: nextTooltip === null ? "none" : "tooltip"
        });
        controlHint.refresh();
    }

    function setLabel(label: string | null): void {
        iconButton.setLabel(label);

        if (hintFollowsLabel) {
            controlHint.setHint(label);
            controlHint.refresh();
        }
    }

    function updateControlHint(nextOptions: Partial<IconButtonCompositionOptions>): void {
        const hintOptions: ControlHintOptions = {};

        if ("hint" in nextOptions) {
            hintFollowsLabel = false;
            hintOptions.hint = nextOptions.hint ?? null;
        } else if ("tooltip" in nextOptions) {
            hintFollowsLabel = false;
            hintOptions.hint = nextOptions.tooltip ?? null;

            if (nextOptions.hintDisplay === undefined) {
                hintOptions.hintDisplay = nextOptions.tooltip === null ? "none" : "tooltip";
            }
        } else if ("label" in nextOptions && hintFollowsLabel) {
            hintOptions.hint = nextOptions.label ?? null;
        }

        if (nextOptions.hintId !== undefined) {
            hintOptions.hintId = nextOptions.hintId;
        }

        if (nextOptions.hintDisplay !== undefined) {
            hintOptions.hintDisplay = nextOptions.hintDisplay;
        }

        if (nextOptions.hintAnnounceOnHover !== undefined) {
            hintOptions.hintAnnounceOnHover = nextOptions.hintAnnounceOnHover;
        } else if (nextOptions.announceOnHover !== undefined) {
            hintOptions.hintAnnounceOnHover = nextOptions.announceOnHover;
        }

        controlHint.update(hintOptions);
        controlHint.refresh();
    }

    composed = {
        ...iconButton,
        element,
        setTitle,
        setHint,
        setTooltip,
        setLabel,
        setSelected: selectedState.setSelected,
        isSelected: selectedState.isSelected,
        toggleSelected: selectedState.toggleSelected,

        update(nextOptions: Partial<IconButtonCompositionOptions>): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("onPress" in nextOptions) {
                onPress = nextOptions.onPress ?? null;
            }

            iconButton.update(getIconButtonOptions(nextOptions, handlePress));

            if (nextOptions.children !== undefined) {
                content.set(nextOptions.children);
            } else if (nextOptions.icon !== undefined) {
                content.set([nextOptions.icon]);
            }

            if (nextOptions.selected !== undefined) {
                selectedState.setSelected(nextOptions.selected);
            }

            if ("title" in nextOptions) {
                setTitle(nextOptions.title ?? null);
            }

            updateControlHint(nextOptions);
        },

        destroy(): void {
            content.dispose();
            iconButton.destroy();
            restoreAttribute(element, "title", originalTitle);
            controlHint.destroy();
            selectedState.destroy();
        }
    };

    return composed;
}
