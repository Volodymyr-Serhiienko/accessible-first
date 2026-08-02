import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent
} from "../composition";
import { createDisclosure } from "./createDisclosure";
import type {
    Disclosure as DisclosureInstance,
    DisclosureOptions
} from "./types";

/**
 * Content accepted by Disclosure trigger and panel slots.
 */
export type DisclosureCompositionContent = CompositionContent;

/**
 * Called when a composed disclosure opens or closes.
 */
export type DisclosureCompositionOnOpenChange = (
    open: boolean,
    disclosure: ComposedDisclosure
) => void;

/**
 * Options for Disclosure().
 */
export interface DisclosureCompositionOptions
    extends Omit<DisclosureOptions, "trigger" | "panel" | "onOpenChange">,
        BaseCompositionOptions {
    trigger: DisclosureCompositionContent;
    panel: DisclosureCompositionContent;
    onOpenChange?: DisclosureCompositionOnOpenChange | null;
}

/**
 * Disclosure created by the composition API.
 */
export interface ComposedDisclosure
    extends Omit<DisclosureInstance, "element" | "trigger" | "panel" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly trigger: HTMLButtonElement;
    readonly panel: HTMLElement;
    setTriggerContent(children: DisclosureCompositionContent): void;
    setPanelContent(children: DisclosureCompositionContent): void;
    update(options: Partial<DisclosureCompositionOptions>): void;
    destroy(): void;
}

function getDisclosureOptions(
    trigger: HTMLElement,
    panel: HTMLElement,
    options: DisclosureCompositionOptions,
    onOpenChange: (open: boolean) => void
): DisclosureOptions {
    const disclosureOptions: DisclosureOptions = {
        trigger,
        panel,
        onOpenChange
    };

    if (options.open !== undefined) {
        disclosureOptions.open = options.open;
    } else {
        disclosureOptions.defaultOpen = options.defaultOpen ?? false;
    }

    if (options.disabled !== undefined) {
        disclosureOptions.disabled = options.disabled;
    }

    if (options.variant !== undefined) {
        disclosureOptions.variant = options.variant;
    }

    if (options.size !== undefined) {
        disclosureOptions.size = options.size;
    }

    if (options.announcement !== undefined) {
        disclosureOptions.announcement = options.announcement;
    }

    return disclosureOptions;
}

function getDisclosureUpdateOptions(
    options: Partial<DisclosureCompositionOptions>,
    onOpenChange: (open: boolean) => void
): Partial<DisclosureOptions> {
    const disclosureOptions: Partial<DisclosureOptions> = {};

    if (options.open !== undefined) {
        disclosureOptions.open = options.open;
    }

    if (options.disabled !== undefined) {
        disclosureOptions.disabled = options.disabled;
    }

    if (options.variant !== undefined) {
        disclosureOptions.variant = options.variant;
    }

    if (options.size !== undefined) {
        disclosureOptions.size = options.size;
    }

    if ("onOpenChange" in options) {
        disclosureOptions.onOpenChange = onOpenChange;
    }

    if (options.announcement !== undefined) {
        disclosureOptions.announcement = options.announcement;
    }

    return disclosureOptions;
}

/**
 * Creates an accessible disclosure with a button trigger and controlled panel.
 */
export function Disclosure(options: DisclosureCompositionOptions): ComposedDisclosure {
    const element = createElement("div", getCompositionElementOptions(options));
    const trigger = createElement("button", {
        attributes: {
            type: "button"
        }
    });
    const panel = createElement("div");

    const triggerContent = createContentSlot(trigger, toCompositionChildren(options.trigger));
    const panelContent = createContentSlot(panel, toCompositionChildren(options.panel));

    let composed!: ComposedDisclosure;
    let onOpenChange = options.onOpenChange ?? null;

    const handleOpenChange = (open: boolean): void => {
        onOpenChange?.(open, composed);
    };

    element.append(trigger, panel);

    const disclosure = createDisclosure(
        element,
        getDisclosureOptions(trigger, panel, options, handleOpenChange)
    );

    function setTriggerContent(children: DisclosureCompositionContent): void {
        triggerContent.set(toCompositionChildren(children));
    }

    function setPanelContent(children: DisclosureCompositionContent): void {
        panelContent.set(toCompositionChildren(children));
    }

    composed = {
        ...disclosure,
        element,
        trigger,
        panel,
        setTriggerContent,
        setPanelContent,

        update(nextOptions: Partial<DisclosureCompositionOptions>): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            disclosure.update(getDisclosureUpdateOptions(nextOptions, handleOpenChange));

            if (nextOptions.trigger !== undefined) {
                setTriggerContent(nextOptions.trigger);
            }

            if (nextOptions.panel !== undefined) {
                setPanelContent(nextOptions.panel);
            }
        },

        destroy(): void {
            triggerContent.dispose();
            panelContent.dispose();
            disclosure.destroy();
        }
    };

    return composed;
}
