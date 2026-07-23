import { setAriaLabelledBy, setRole } from "../../../core/src/aria";
import {
    createContentSlot,
    createElement,
    type BaseCompositionOptions,
    type CompositionChild,
    type CreateElementOptions
} from "../composition";
import { createAccordion } from "./createAccordion";
import type {
    Accordion as AccordionInstance,
    AccordionHeadingLevel,
    AccordionItem,
    AccordionItemOptions,
    AccordionOpenChangeDetail,
    AccordionOptions,
    AccordionPanelRole
} from "./types";
import type { DisclosureAnnouncement } from "../disclosure";

/**
 * Flexible content payload representing a single composition child node or an array of child nodes for accordion elements.
 */
export type AccordionCompositionContent = CompositionChild | CompositionChild[];

type AccordionHeadingTagName = "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * Configuration characteristics defining the structural content, heading hierarchy, 
 * and initial disclosure state for a single composed accordion item segment.
 */
export interface AccordionCompositionItem extends BaseCompositionOptions {
    value?: string;
    trigger: AccordionCompositionContent;
    panel: AccordionCompositionContent;
    headingLevel?: AccordionHeadingLevel;
    disabled?: boolean;
    defaultOpen?: boolean;
    open?: boolean;
    announcement?: DisclosureAnnouncement;
}

/**
 * Event notification details packed and dispatched when an individual composed accordion section mutates its disclosure state.
 */
export interface AccordionCompositionOpenChangeDetail {
    value: string;
    open: boolean;
    item: ComposedAccordionItem;
}

/**
 * Callback function signature triggered when an accordion item expands or collapses.
 * 
 * @param detail - State payload containing the updated item, its value, and expansion status.
 * @param accordion - The parent composed accordion instance orchestrating the change.
 */
export type AccordionCompositionOnOpenChange = (
    detail: AccordionCompositionOpenChangeDetail,
    accordion: ComposedAccordion
) => void;

/**
 * Global composition options configuring structural behavior rules, items, and event handlers for an accordion instance.
 */
export interface AccordionCompositionOptions
    extends Omit<AccordionOptions, "items" | "onOpenChange">,
        BaseCompositionOptions {
    items: AccordionCompositionItem[];
    onOpenChange?: AccordionCompositionOnOpenChange | null;
}

/**
 * Represents a fully assembled structural accordion item, exposing typed DOM node references and dynamic content modifiers.
 */
export interface ComposedAccordionItem
    extends Omit<AccordionItem, "element" | "trigger" | "panel"> {
    readonly element: HTMLElement;
    readonly heading: HTMLHeadingElement;
    readonly trigger: HTMLButtonElement;
    readonly panel: HTMLElement;
    setTriggerContent(content: AccordionCompositionContent): void;
    setPanelContent(content: AccordionCompositionContent): void;
}

/**
 * Represents a fully assembled composition-based accordion instance orchestrating multiple item segments.
 */
export interface ComposedAccordion
    extends Omit<AccordionInstance, "element" | "items" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly items: ComposedAccordionItem[];
    update(options: Partial<AccordionCompositionOptions>): void;
    destroy(): void;
}

interface AccordionItemNodes {
    element: HTMLElement;
    heading: HTMLHeadingElement;
    trigger: HTMLButtonElement;
    panel: HTMLElement;
    triggerContent: ReturnType<typeof createContentSlot>;
    panelContent: ReturnType<typeof createContentSlot>;
}

function getElementOptions(options: BaseCompositionOptions): CreateElementOptions {
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

function toChildren(content: AccordionCompositionContent): CompositionChild[] {
    return Array.isArray(content) ? content : [content];
}

function getHeadingTag(level: AccordionHeadingLevel): AccordionHeadingTagName {
    return `h${level}` as AccordionHeadingTagName;
}

function shouldUsePanelRegion(panelRole: AccordionPanelRole, itemCount: number): boolean {
    if (panelRole === "region") {
        return true;
    }

    if (panelRole === "none") {
        return false;
    }

    return itemCount <= 6;
}

function syncPanelSemantics(
    itemNodes: AccordionItemNodes[],
    panelRole: AccordionPanelRole
): void {
    const useRegion = shouldUsePanelRegion(panelRole, itemNodes.length);

    for (const node of itemNodes) {
        if (useRegion) {
            setRole(node.panel, "region");
            setAriaLabelledBy(node.panel, node.trigger);
        } else {
            setRole(node.panel, null);
            node.panel.removeAttribute("aria-labelledby");
        }
    }
}

function createItemNodes(
    item: AccordionCompositionItem,
    defaultHeadingLevel: AccordionHeadingLevel
): AccordionItemNodes {
    const element = createElement("div", getElementOptions(item));
    const heading = createElement(getHeadingTag(item.headingLevel ?? defaultHeadingLevel), {
        attributes: {
            "data-af-accordion-heading": ""
        }
    });
    const trigger = createElement("button", {
        attributes: {
            type: "button"
        }
    });
    const panel = createElement("div");

    const triggerContent = createContentSlot(trigger, toChildren(item.trigger));
    const panelContent = createContentSlot(panel, toChildren(item.panel));

    heading.append(trigger);
    element.append(heading, panel);

    return {
        element,
        heading,
        trigger,
        panel,
        triggerContent,
        panelContent
    };
}

function getAccordionOptions(
    options: AccordionCompositionOptions,
    itemNodes: AccordionItemNodes[],
    onOpenChange: (detail: AccordionOpenChangeDetail) => void
): AccordionOptions {
    const accordionOptions: AccordionOptions = {
        items: itemNodes.map((node, index): AccordionItemOptions => {
            const source = options.items[index];
            const itemOptions: AccordionItemOptions = {
                element: node.element,
                trigger: node.trigger,
                panel: node.panel
            };

            if (source?.value !== undefined) {
                itemOptions.value = source.value;
            }

            if (source?.disabled !== undefined) {
                itemOptions.disabled = source.disabled;
            }

            if (source?.defaultOpen !== undefined) {
                itemOptions.defaultOpen = source.defaultOpen;
            }

            if (source?.open !== undefined) {
                itemOptions.open = source.open;
            }

            if (source?.announcement !== undefined) {
                itemOptions.announcement = source.announcement;
            }

            return itemOptions;
        }),
        onOpenChange
    };

    if (options.multiple !== undefined) accordionOptions.multiple = options.multiple;
    if (options.collapsible !== undefined) accordionOptions.collapsible = options.collapsible;
    if (options.disabled !== undefined) accordionOptions.disabled = options.disabled;
    if (options.loop !== undefined) accordionOptions.loop = options.loop;
    if (options.variant !== undefined) accordionOptions.variant = options.variant;
    if (options.size !== undefined) accordionOptions.size = options.size;
    if (options.headingLevel !== undefined) accordionOptions.headingLevel = options.headingLevel;
    if (options.panelRole !== undefined) accordionOptions.panelRole = options.panelRole;
    if (options.announcement !== undefined) accordionOptions.announcement = options.announcement;

    return accordionOptions;
}

function getAccordionUpdateOptions(
    options: Partial<AccordionCompositionOptions>,
    onOpenChange: (detail: AccordionOpenChangeDetail) => void
): Partial<Omit<AccordionOptions, "items">> {
    const accordionOptions: Partial<Omit<AccordionOptions, "items">> = {};

    if (options.multiple !== undefined) accordionOptions.multiple = options.multiple;
    if (options.collapsible !== undefined) accordionOptions.collapsible = options.collapsible;
    if (options.disabled !== undefined) accordionOptions.disabled = options.disabled;
    if (options.loop !== undefined) accordionOptions.loop = options.loop;
    if (options.variant !== undefined) accordionOptions.variant = options.variant;
    if (options.size !== undefined) accordionOptions.size = options.size;
    if (options.headingLevel !== undefined) accordionOptions.headingLevel = options.headingLevel;
    if (options.panelRole !== undefined) accordionOptions.panelRole = options.panelRole;
    if (options.announcement !== undefined) accordionOptions.announcement = options.announcement;

    if ("onOpenChange" in options) {
        accordionOptions.onOpenChange = onOpenChange;
    }

    return accordionOptions;
}

/**
 * Assembles a fully composed, accessible accordion instance that orchestrates multi-panel disclosure states,
 * keyboard interactions, and dynamic content updates.
 * 
 * @param options - Configuration characteristics specifying items, panel role semantics, and lifecycle event handlers.
 * @returns A ComposedAccordion package exposing controls to open/close items, update options dynamically, or tear down state bindings.
 */
export function Accordion(options: AccordionCompositionOptions): ComposedAccordion {
    const element = createElement("div", getElementOptions(options));
    const headingLevel = options.headingLevel ?? 3;
    const itemNodes = options.items.map((item) => createItemNodes(item, headingLevel));

    let panelRole = options.panelRole ?? "auto";

    syncPanelSemantics(itemNodes, panelRole);

    for (const item of itemNodes) {
        element.append(item.element);
    }

    let composed!: ComposedAccordion;
    let composedItems: ComposedAccordionItem[] = [];
    let onOpenChange = options.onOpenChange ?? null;

    const handleOpenChange = (detail: AccordionOpenChangeDetail): void => {
        const item = composedItems.find((candidate) => candidate.value === detail.value);

        if (!item) {
            return;
        }

        onOpenChange?.(
            {
                value: detail.value,
                open: detail.open,
                item
            },
            composed
        );
    };

    const accordion = createAccordion(
        element,
        getAccordionOptions(options, itemNodes, handleOpenChange)
    );

    composedItems = accordion.items.map((item, index): ComposedAccordionItem => {
        const node = itemNodes[index];

        if (!node) {
            throw new Error("Accordion item node is missing.");
        }

        return {
            ...item,
            element: node.element,
            heading: node.heading,
            trigger: node.trigger,
            panel: node.panel,

            setTriggerContent(content): void {
                node.triggerContent.set(toChildren(content));
            },

            setPanelContent(content): void {
                node.panelContent.set(toChildren(content));
            }
        };
    });

    composed = {
        ...accordion,
        element,
        items: composedItems,

        update(nextOptions): void {
            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if (nextOptions.panelRole !== undefined) {
                panelRole = nextOptions.panelRole;
                syncPanelSemantics(itemNodes, panelRole);
            }

            accordion.update(getAccordionUpdateOptions(nextOptions, handleOpenChange));

            if (nextOptions.items !== undefined) {
                nextOptions.items.forEach((nextItem, index) => {
                    const item = composedItems[index];

                    if (!item) {
                        return;
                    }

                    item.setTriggerContent(nextItem.trigger);
                    item.setPanelContent(nextItem.panel);

                    if (nextItem.disabled !== undefined) {
                        item.setDisabled(nextItem.disabled);
                    }

                    if (nextItem.open !== undefined) {
                        item.setOpen(nextItem.open);
                    }

                    if (nextItem.announcement !== undefined) {
                        item.disclosure.update({ announcement: nextItem.announcement });
                    }
                });
            }
        },

        destroy(): void {
            for (const node of itemNodes) {
                node.triggerContent.dispose();
                node.panelContent.dispose();
            }

            accordion.destroy();
        }
    };

    return composed;
}
