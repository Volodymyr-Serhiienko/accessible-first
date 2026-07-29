import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type CompositionChild
} from "../composition";
import { createIconButton } from "./createIconButton";
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
    onPress?: IconButtonCompositionOnPress | null;
}

/**
 * An icon button created by IconButton().
 * Includes accessible-name controls, pressed state, content updates, and cleanup.
 */
export interface ComposedIconButton extends Omit<IconButtonInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLButtonElement;
    setTitle(title: string | null): void;
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

function syncTitleFromLabel(element: HTMLElement, label: string | null): void {
    if (label?.trim()) {
        element.title = label;
        return;
    }

    element.removeAttribute("title");
}

/**
 * Creates an accessible icon-only button with default styling hooks.
 */
export function IconButton(options: IconButtonCompositionOptions = {}): ComposedIconButton {
    const element = createElement("button", getCompositionElementOptions(options));
    const content = createContentSlot(element, getChildren(options));

    let composed!: ComposedIconButton;
    let onPress = options.onPress ?? null;
    let syncTitleWithLabel = options.title === undefined;

    const handlePress = (event: Event): void => {
        onPress?.(event, composed);
    };

    const iconButton = createIconButton(
        element,
        getIconButtonOptions(options, handlePress)
    );

    if ("title" in options) {
        if (options.title === null || options.title === undefined) {
            element.removeAttribute("title");
        } else {
            element.title = options.title;
        }
    } else if (typeof options.label === "string") {
        syncTitleFromLabel(element, options.label);
    }

    function setTitle(title: string | null): void {
        syncTitleWithLabel = false;

        if (title === null) {
            element.removeAttribute("title");
            return;
        }

        element.title = title;
    }

    function setLabel(label: string | null): void {
        iconButton.setLabel(label);

        if (syncTitleWithLabel) {
            syncTitleFromLabel(element, label);
        }
    }

    composed = {
        ...iconButton,
        element,
        setTitle,
        setLabel,

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

            if ("title" in nextOptions) {
                setTitle(nextOptions.title ?? null);
            } else if ("label" in nextOptions && syncTitleWithLabel) {
                syncTitleFromLabel(element, nextOptions.label ?? null);
            }
        },

        destroy(): void {
            content.dispose();
            iconButton.destroy();
        }
    };

    return composed;
}
