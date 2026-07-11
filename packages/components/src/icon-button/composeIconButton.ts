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
 * Configuration capabilities defining functional behaviors, explicit graphical layouts, 
 * accessible visual identifiers, and structural base values for an interactive Icon Button element.
 */
export interface IconButtonCompositionOptions extends IconButtonOptions, BaseCompositionOptions {
    icon?: CompositionChild;
    children?: CompositionChild[];
    title?: string | null;
}

/**
 * Interface representing a managed, accessibly optimized native HTMLButtonElement built primarily around visual graphic indicators.
 * Exposes explicit semantic controls to dynamically handle descriptive data labels, shift internal assets, 
 * alter focus states, and securely dump binding scopes at teardown.
 */
export interface ComposedIconButton extends Omit<IconButtonInstance, "element" | "update" | "destroy"> {
    readonly element: HTMLButtonElement;
    setTitle(title: string | null): void;
    update(options: IconButtonCompositionOptions): void;
    destroy(): void;
}

function getElementOptions(options: IconButtonCompositionOptions): CreateElementOptions {
    const elementOptions: CreateElementOptions = {};

    if (options.id !== undefined) elementOptions.id = options.id;
    if (options.className !== undefined) elementOptions.className = options.className;
    if (options.attributes !== undefined) elementOptions.attributes = options.attributes;

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

function syncTitleFromLabel(element: HTMLElement, label: string | null): void {
    if (label?.trim()) {
        element.title = label;
        return;
    }

    element.removeAttribute("title");
}

/**
 * Instantiates and coordinates an enhanced, accessibly optimized native HTMLButtonElement built around structural graphics.
 * Wraps interactive icon configurations, automatically synchronizes fallback visual tooltip descriptions (`title`) 
 * with core screen-reader labels (`aria-label`), manages complex graphic rendering slot pools, and guarantees clean, 
 * isolated runtime state teardowns.
 *
 * @param options - Visual asset properties, fallback tooltips, initial text strings, and layout behaviors applied at creation time.
 * @returns An interactive ComposedIconButton interface revealing localized layout modifications and lifecycle tracking utilities.
 */
export function IconButton(options: IconButtonCompositionOptions = {}): ComposedIconButton {
    const element = createElement("button", getElementOptions(options));
    const content = createContentSlot(element, getChildren(options));
    const iconButton = createIconButton(element, options);

    let syncTitleWithLabel = options.title === undefined;

    if (options.title !== undefined) {
        if (options.title === null) {
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

    return {
        ...iconButton,
        element,
        setTitle,
        setLabel,

        update(nextOptions: IconButtonCompositionOptions): void {
            iconButton.update(nextOptions);

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
}
