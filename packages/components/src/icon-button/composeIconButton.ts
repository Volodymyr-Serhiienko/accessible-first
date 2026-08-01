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
    createSelectedState,
    type SelectedStateOptions
} from "../foundation";
import { createTooltip } from "../tooltip";

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

    let tooltipFollowsLabel = options.tooltip === undefined;

    const tooltip = createTooltip(element, {
        text: tooltipFollowsLabel ? options.label ?? null : options.tooltip ?? null,
        announceOnHover: options.announceOnHover ?? true
    });

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

    function setTooltip(nextTooltip: string | null): void {
        tooltipFollowsLabel = false;
        tooltip.setText(nextTooltip);
    }

    function setLabel(label: string | null): void {
        iconButton.setLabel(label);

        if (tooltipFollowsLabel) {
            tooltip.setText(label);
        }
    }

    composed = {
        ...iconButton,
        element,
        setTitle,
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

            if (nextOptions.announceOnHover !== undefined) {
                tooltip.setAnnounceOnHover(nextOptions.announceOnHover);
            }

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

            if ("tooltip" in nextOptions) {
                setTooltip(nextOptions.tooltip ?? null);
            } else if ("label" in nextOptions && tooltipFollowsLabel) {
                tooltip.setText(nextOptions.label ?? null);
            }
        },

        destroy(): void {
            content.dispose();
            iconButton.destroy();
            restoreAttribute(element, "title", originalTitle);
            tooltip.destroy();
            selectedState.destroy();
        }
    };

    return composed;
}
