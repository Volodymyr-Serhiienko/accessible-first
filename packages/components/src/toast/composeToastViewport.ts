import {
    applyCompositionElementOptions,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions
} from "../composition";
import { createToastViewport } from "./createToastViewport";
import type {
    ToastViewport as ToastViewportInstance,
    ToastViewportOptions
} from "./types";

/**
 * Options for ToastViewport(), the composition API for visible notifications.
 */
export interface ToastViewportCompositionOptions
    extends ToastViewportOptions,
        BaseCompositionOptions {}

/**
 * Options accepted by ComposedToastViewport.update().
 */
export interface ToastViewportCompositionUpdateOptions
    extends Partial<ToastViewportCompositionOptions> {}

/**
 * Toast viewport created by the composition API.
 */
export interface ComposedToastViewport
    extends Omit<ToastViewportInstance, "element" | "viewport" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly viewport: HTMLElement;
    update(options: ToastViewportCompositionUpdateOptions): void;
    destroy(): void;
}

function getToastViewportOptions(
    options: ToastViewportCompositionUpdateOptions
): ToastViewportOptions {
    const viewportOptions: ToastViewportOptions = {};

    if (options.placement !== undefined) viewportOptions.placement = options.placement;
    if (options.label !== undefined) viewportOptions.label = options.label;
    if ("limit" in options) viewportOptions.limit = options.limit ?? null;
    if ("duration" in options) viewportOptions.duration = options.duration ?? null;
    if (options.dismissible !== undefined) viewportOptions.dismissible = options.dismissible;
    if (options.closeLabel !== undefined) viewportOptions.closeLabel = options.closeLabel;
    if ("locale" in options) viewportOptions.locale = options.locale ?? null;
    if (options.pauseOnHover !== undefined) viewportOptions.pauseOnHover = options.pauseOnHover;
    if (options.newestOnTop !== undefined) viewportOptions.newestOnTop = options.newestOnTop;

    return viewportOptions;
}

/**
 * Creates a composed toast viewport.
 */
export function ToastViewport(
    options: ToastViewportCompositionOptions = {}
): ComposedToastViewport {
    const element = createElement("div", getCompositionElementOptions(options));
    const viewport = createToastViewport(element, getToastViewportOptions(options));

    return {
        ...viewport,
        element,
        viewport: element,

        update(nextOptions: ToastViewportCompositionUpdateOptions): void {
            applyCompositionElementOptions(element, nextOptions);
            viewport.update(getToastViewportOptions(nextOptions));
        },

        destroy(): void {
            viewport.destroy();
        }
    };
}
