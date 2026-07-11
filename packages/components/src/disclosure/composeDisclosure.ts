import {
    createContentSlot,
    createElement,
    type BaseCompositionOptions,
    type CompositionChild,
    type CreateElementOptions
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
 * Configuration criteria adapting state machines, structural identification tags, and core custom 
 * content zones to configure a standard Disclosure UI element.
 */
export interface DisclosureCompositionOptions
    extends Omit<DisclosureOptions, "trigger" | "panel">,
        BaseCompositionOptions {
    trigger: DisclosureCompositionContent;
    panel: DisclosureCompositionContent;
}

/**
 * Interface representing a managed, accessibly sound native collapsible toggle layout architecture.
 * Pairs control button triggers with corresponding expander panels using strict semantic parameters 
 * (`aria-expanded`, `aria-controls`), offering clear state modifications and lifecycle tracking routines.
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

function getElementOptions(options: DisclosureCompositionOptions): CreateElementOptions {
    const elementOptions: CreateElementOptions = {};

    if (options.id !== undefined) elementOptions.id = options.id;
    if (options.className !== undefined) elementOptions.className = options.className;
    if (options.attributes !== undefined) elementOptions.attributes = options.attributes;

    return elementOptions;
}

function toChildren(content: DisclosureCompositionContent): CompositionChild[] {
    return Array.isArray(content) ? content : [content];
}

function getDisclosureOptions(
    trigger: HTMLElement,
    panel: HTMLElement,
    options: DisclosureCompositionOptions
): DisclosureOptions {
    const disclosureOptions: DisclosureOptions = {
        trigger,
        panel
    };

    if (options.defaultOpen !== undefined) disclosureOptions.defaultOpen = options.defaultOpen;
    if (options.open !== undefined) disclosureOptions.open = options.open;
    if (options.disabled !== undefined) disclosureOptions.disabled = options.disabled;
    if (options.variant !== undefined) disclosureOptions.variant = options.variant;
    if (options.size !== undefined) disclosureOptions.size = options.size;
    if (options.onOpenChange !== undefined) disclosureOptions.onOpenChange = options.onOpenChange;

    return disclosureOptions;
}

/**
 * Instantiates and coordinates an enhanced, accessibly sound collapsible structural Disclosure element.
 * Arranges structural layout fragments by wrapping control elements and toggle panels inside a 
 * base layout container, linking them with strict semantic parameters while orchestrating sub-component 
 * lifecycles for predictable, memory-safe unmounting configurations.
 *
 * @param options - Core layout parameters, state machine properties, and initial child tree tokens.
 * @returns A ComposedDisclosure context enabling interactive state mapping and dynamic inner view swaps.
 */
export function Disclosure(options: DisclosureCompositionOptions): ComposedDisclosure {
    const element = createElement("div", getElementOptions(options));
    const trigger = createElement("button", {
        attributes: {
            type: "button"
        }
    });
    const panel = createElement("div");

    const triggerContent = createContentSlot(trigger, toChildren(options.trigger));
    const panelContent = createContentSlot(panel, toChildren(options.panel));

    element.append(trigger, panel);

    const disclosure = createDisclosure(
        element,
        getDisclosureOptions(trigger, panel, options)
    );

    function setTriggerContent(children: DisclosureCompositionContent): void {
        triggerContent.set(toChildren(children));
    }

    function setPanelContent(children: DisclosureCompositionContent): void {
        panelContent.set(toChildren(children));
    }

    return {
        ...disclosure,
        element,
        trigger,
        panel,
        setTriggerContent,
        setPanelContent,

        update(nextOptions: Partial<DisclosureCompositionOptions>): void {
            const behaviorOptions: Partial<DisclosureOptions> = {};

            if (nextOptions.open !== undefined) behaviorOptions.open = nextOptions.open;
            if (nextOptions.disabled !== undefined) behaviorOptions.disabled = nextOptions.disabled;
            if (nextOptions.variant !== undefined) behaviorOptions.variant = nextOptions.variant;
            if (nextOptions.size !== undefined) behaviorOptions.size = nextOptions.size;

            if ("onOpenChange" in nextOptions) {
                behaviorOptions.onOpenChange = nextOptions.onOpenChange ?? null;
            }

            disclosure.update(behaviorOptions);

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
}
