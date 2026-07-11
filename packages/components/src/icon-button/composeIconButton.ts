import {
    createContentSlot,
    createElement,
    type BaseCompositionOptions,
    type CompositionChild,
    type CreateElementOptions
} from "../composition";
import { createIconButton } from "./createIconButton";
import type { IconButton as IconButtonInstance, IconButtonOptions } from "./types";

/**
 * Callback function signature executed when a visual icon button receives an operational activation event.
 * Passes both the original native DOM interaction event and the orchestrating component controller context.
 * 
 * @param event - The native browser Event object triggered by pointer, keyboard, or voice activation.
 * @param button - The contextual ComposedIconButton manager instance executing the action.
 */
export type IconButtonCompositionOnPress = (
    event: Event,
    button: ComposedIconButton
) => void;

/**
 * Configuration characteristics defining functional behaviors, explicit graphical layouts, 
 * accessible visual identifiers, event pipelines, and structural base values for an interactive Icon Button element.
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
 * Interface representing a managed, accessibly optimized native HTMLButtonElement built primarily around visual graphic indicators.
 * Houses core structural references while providing functional controls to handle descriptive data labels, 
 * swap layout graphics, manage custom callback streams, and securely dump binding scopes at teardown.
 */
export interface ComposedIconButton extends Omit<IconButtonInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLButtonElement;
    setTitle(title: string | null): void;
    update(options: IconButtonCompositionOptions): void;
    destroy(): void;
}

function getElementOptions(options: IconButtonCompositionOptions): CreateElementOptions {
    const elementOptions: CreateElementOptions = {};

    if (options.id !== undefined) {
        elementOptions.id = options.id;
    }

    if (options.className !== undefined) {
        elementOptions.className = options.className;
    }

    if (options.attributes !== undefined) {
        elementOptions.attributes = options.attributes;
    }

    return elementOptions;
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
    options: IconButtonCompositionOptions,
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
 * Instantiates and coordinates an enhanced, accessibly optimized native HTMLButtonElement built around structural graphics with dynamic event injection.
 * Wraps interactive icon configurations, automatically synchronizes fallback visual tooltip descriptions (`title`) 
 * with core screen-reader labels (`aria-label`), hooks up context-aware activation event overrides (`onPress`), 
 * manages complex graphic rendering slot pools, and guarantees clean, isolated runtime state teardowns.
 *
 * @param options - Visual asset properties, fallback tooltips, initial action hooks, and layout behaviors applied at creation time.
 * @returns An interactive ComposedIconButton instance revealing localized layout modifications and lifecycle tracking utilities.
 */
export function IconButton(options: IconButtonCompositionOptions = {}): ComposedIconButton {
    const element = createElement("button", getElementOptions(options));
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

        update(nextOptions: IconButtonCompositionOptions): void {
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
