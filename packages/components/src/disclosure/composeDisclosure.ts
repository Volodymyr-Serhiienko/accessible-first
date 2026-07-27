import {
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type CompositionChild
} from "../composition";
import { createDisclosure } from "./createDisclosure";
import type {
    Disclosure as DisclosureInstance,
    DisclosureOptions
} from "./types";

/**
 * Defines the polymorphic structural layouts or collections allowed within Disclosure interactive sectors.
 */
export type DisclosureCompositionContent = CompositionChild | CompositionChild[];

/**
 * Callback function signature executed when a collapsible disclosure component changes its toggle state.
 * Passes both the new boolean state representation and the orchestrating controller instance.
 * 
 * @param open - The updated visibility state, where `true` is expanded and `false` is collapsed.
 * @param disclosure - The contextual ComposedDisclosure manager instance executing the state shift.
 */
export type DisclosureCompositionOnOpenChange = (
    open: boolean,
    disclosure: ComposedDisclosure
) => void;

/**
 * Configuration criteria adapting state machines, structural identification tags, callback hooks, 
 * and core custom content zones to configure a standard Disclosure UI element.
 */
export interface DisclosureCompositionOptions
    extends Omit<DisclosureOptions, "trigger" | "panel" | "onOpenChange">,
        BaseCompositionOptions {
    trigger: DisclosureCompositionContent;
    panel: DisclosureCompositionContent;
    onOpenChange?: DisclosureCompositionOnOpenChange | null;
}

/**
 * Interface representing a managed, accessibly sound native collapsible toggle layout architecture.
 * Pairs control button triggers with corresponding expander panels using strict semantic parameters 
 * (`aria-expanded`, `aria-controls`), offering explicit state updates, dynamic layout manipulation, 
 * and structural teardown routines.
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

function toChildren(content: DisclosureCompositionContent): CompositionChild[] {
    return Array.isArray(content) ? content : [content];
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

    if (options.defaultOpen !== undefined) {
        disclosureOptions.defaultOpen = options.defaultOpen;
    }

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
 * Instantiates and coordinates an enhanced, accessibly sound collapsible structural Disclosure element with dynamic event injection.
 * Arranges structural layout fragments by wrapping control elements and toggle panels inside a base layout container, 
 * linking them with strict semantic parameters, hooks up context-aware state mutation callbacks (`onOpenChange`), 
 * and orchestrates nested rendering slots for predictable, memory-safe lifecycle teardowns.
 *
 * @param options - Core layout parameters, active state configurations, visibility mutation hooks, and initial child trees.
 * @returns A ComposedDisclosure context enabling interactive state mapping, update bindings, and structural view swaps.
 */
export function Disclosure(options: DisclosureCompositionOptions): ComposedDisclosure {
    const element = createElement("div", getCompositionElementOptions(options));
    const trigger = createElement("button", {
        attributes: {
            type: "button"
        }
    });
    const panel = createElement("div");

    const triggerContent = createContentSlot(trigger, toChildren(options.trigger));
    const panelContent = createContentSlot(panel, toChildren(options.panel));

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
        triggerContent.set(toChildren(children));
    }

    function setPanelContent(children: DisclosureCompositionContent): void {
        panelContent.set(toChildren(children));
    }

    composed = {
        ...disclosure,
        element,
        trigger,
        panel,
        setTriggerContent,
        setPanelContent,

        update(nextOptions: Partial<DisclosureCompositionOptions>): void {
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
