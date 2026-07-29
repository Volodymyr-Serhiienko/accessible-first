import { setAriaLabelledBy, setRole } from "../../../core/src/aria";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent
} from "../composition";
import { createAccordion } from "./createAccordion";
import type { DisclosureAnnouncement } from "../disclosure";
import type {
    Accordion as AccordionInstance,
    AccordionHeadingLevel,
    AccordionItem,
    AccordionItemOptions,
    AccordionOpenChangeDetail,
    AccordionOptions,
    AccordionPanelRole
} from "./types";

/**
 * Content accepted by accordion trigger and panel slots.
 */
export type AccordionCompositionContent = CompositionContent;

type AccordionHeadingTagName = "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * One item accepted by Accordion().
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
 * Details passed when a composed accordion item opens or closes.
 */
export interface AccordionCompositionOpenChangeDetail {
    value: string;
    open: boolean;
    item: ComposedAccordionItem;
}

/**
 * Called when a composed accordion item opens or closes.
 */
export type AccordionCompositionOnOpenChange = (
    detail: AccordionCompositionOpenChangeDetail,
    accordion: ComposedAccordion
) => void;

/**
 * Options for Accordion().
 */
export interface AccordionCompositionOptions
    extends Omit<AccordionOptions, "items" | "onOpenChange">,
        BaseCompositionOptions {
    items: AccordionCompositionItem[];
    headingLevel?: AccordionHeadingLevel;
    panelRole?: AccordionPanelRole;
    onOpenChange?: AccordionCompositionOnOpenChange | null;
}

/**
 * Partial item update accepted by accordion.update({ items }).
 *
 * value and headingLevel are creation-time options.
 */
export interface AccordionCompositionItemUpdate extends BaseCompositionOptions {
    trigger?: AccordionCompositionContent;
    panel?: AccordionCompositionContent;
    disabled?: boolean;
    open?: boolean;
    announcement?: DisclosureAnnouncement;
}

/**
 * Options accepted by ComposedAccordion.update().
 *
 * headingLevel is creation-time only because it creates native heading elements.
 */
export interface AccordionCompositionUpdateOptions
    extends Partial<Omit<AccordionCompositionOptions, "items" | "headingLevel">> {
    items?: AccordionCompositionItemUpdate[];
}

/**
 * Accordion item created by the composition API.
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
 * Accordion created by the composition API.
 */
export interface ComposedAccordion
    extends Omit<AccordionInstance, "element" | "items" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly items: ComposedAccordionItem[];
    update(options: AccordionCompositionUpdateOptions): void;
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
    const element = createElement("div", getCompositionElementOptions(item));
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

    const triggerContent = createContentSlot(trigger, toCompositionChildren(item.trigger));
    const panelContent = createContentSlot(panel, toCompositionChildren(item.panel));

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
    if (options.announcement !== undefined) accordionOptions.announcement = options.announcement;

    return accordionOptions;
}

function getAccordionUpdateOptions(
    options: AccordionCompositionUpdateOptions,
    onOpenChange: (detail: AccordionOpenChangeDetail) => void
): Partial<Omit<AccordionOptions, "items">> {
    const accordionOptions: Partial<Omit<AccordionOptions, "items">> = {};

    if (options.multiple !== undefined) accordionOptions.multiple = options.multiple;
    if (options.collapsible !== undefined) accordionOptions.collapsible = options.collapsible;
    if (options.disabled !== undefined) accordionOptions.disabled = options.disabled;
    if (options.loop !== undefined) accordionOptions.loop = options.loop;
    if (options.variant !== undefined) accordionOptions.variant = options.variant;
    if (options.size !== undefined) accordionOptions.size = options.size;
    if (options.announcement !== undefined) accordionOptions.announcement = options.announcement;

    if ("onOpenChange" in options) {
        accordionOptions.onOpenChange = onOpenChange;
    }

    return accordionOptions;
}

/**
 * Creates an accessible accordion from composed disclosure items.
 */
export function Accordion(options: AccordionCompositionOptions): ComposedAccordion {
    const element = createElement("div", getCompositionElementOptions(options));
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
                node.triggerContent.set(toCompositionChildren(content));
            },

            setPanelContent(content): void {
                node.panelContent.set(toCompositionChildren(content));
            }
        };
    });

    composed = {
        ...accordion,
        element,
        items: composedItems,

        update(nextOptions: AccordionCompositionUpdateOptions): void {
            applyCompositionElementOptions(element, nextOptions);

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

                    const node = itemNodes[index];

                    if (!node) {
                        return;
                    }

                    applyCompositionElementOptions(node.element, nextItem);

                    if (nextItem.trigger !== undefined) {
                        item.setTriggerContent(nextItem.trigger);
                    }

                    if (nextItem.panel !== undefined) {
                        item.setPanelContent(nextItem.panel);
                    }

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
