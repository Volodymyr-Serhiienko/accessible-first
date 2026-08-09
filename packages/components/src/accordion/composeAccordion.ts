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
import { createId } from "../../../core/src/id";
import { restoreAttribute } from "../../../core/src/dom";
import { createAccordion } from "./createAccordion";
import type { DisclosureAnnouncement, DisclosureDescriptionMode } from "../disclosure";
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

/**
 * Controls whether an item description is only panel content or also linked to its trigger.
 */
export type AccordionDescriptionMode = DisclosureDescriptionMode;

type AccordionHeadingTagName = "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * One item accepted by Accordion().
 */
export interface AccordionCompositionItem extends BaseCompositionOptions {
    value?: string;
    trigger: AccordionCompositionContent;
    panel: AccordionCompositionContent;
    description?: string | null;
    descriptionId?: string;
    descriptionMode?: AccordionDescriptionMode;
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
    descriptionMode?: AccordionDescriptionMode;
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
    description?: string | null;
    descriptionId?: string;
    descriptionMode?: AccordionDescriptionMode;
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
    readonly description: HTMLElement;
    readonly body: HTMLElement;
    setDescription(description: string | null): void;
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
    description: HTMLElement;
    body: HTMLElement;
    triggerContent: ReturnType<typeof createContentSlot>;
    panelContent: ReturnType<typeof createContentSlot>;
    descriptionMode: AccordionDescriptionMode;
    ownDescriptionMode: AccordionDescriptionMode | undefined;
    ownAnnouncement: DisclosureAnnouncement | undefined;
    originalTriggerDescribedBy: string | null;
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

function hasDescription(value: string | null | undefined): value is string {
    return Boolean(value?.trim());
}

function getDescriptionText(description: HTMLElement): string {
    return description.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function getDescriptionAnnouncement(description: HTMLElement): DisclosureAnnouncement | undefined {
    const text = getDescriptionText(description);

    return text || undefined;
}

function removeIdReference(value: string | null, id: string): string | null {
    const nextValue = (value ?? "")
        .split(/\s+/)
        .filter((item) => item && item !== id)
        .join(" ");

    return nextValue || null;
}

function joinIdReferences(value: string | null, id: string): string {
    const ids = new Set((value ?? "").split(/\s+/).filter(Boolean));
    ids.add(id);

    return Array.from(ids).join(" ");
}

function shouldUseAriaDescription(
    mode: AccordionDescriptionMode,
    description: HTMLElement
): boolean {
    return mode === "aria" && Boolean(getDescriptionText(description));
}

function removeTriggerDescriptionReference(
    node: AccordionItemNodes,
    descriptionId = node.description.id
): void {
    const current = removeIdReference(node.trigger.getAttribute("aria-describedby"), descriptionId);

    if (current) {
        node.trigger.setAttribute("aria-describedby", current);
        return;
    }

    restoreAttribute(node.trigger, "aria-describedby", node.originalTriggerDescribedBy);
}

function syncTriggerDescription(node: AccordionItemNodes): void {
    const current = removeIdReference(
        node.trigger.getAttribute("aria-describedby"),
        node.description.id
    );

    if (shouldUseAriaDescription(node.descriptionMode, node.description)) {
        node.trigger.setAttribute("aria-describedby", joinIdReferences(current, node.description.id));
        return;
    }

    if (current) {
        node.trigger.setAttribute("aria-describedby", current);
        return;
    }

    restoreAttribute(node.trigger, "aria-describedby", node.originalTriggerDescribedBy);
}

function setItemDescription(node: AccordionItemNodes, nextDescription: string | null): void {
    const text = nextDescription?.trim() ?? "";

    node.description.textContent = text;
    node.description.hidden = !text;
    syncTriggerDescription(node);
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
    defaultHeadingLevel: AccordionHeadingLevel,
    defaultDescriptionMode: AccordionDescriptionMode
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

    const description = createElement("p", {
        id: item.descriptionId ?? createId("af-accordion-description"),
        text: item.description ?? "",
        attributes: {
            "data-af-disclosure-description": ""
        }
    });

    const body = createElement("div", {
        attributes: {
            "data-af-disclosure-body": ""
        }
    });

    const triggerContent = createContentSlot(trigger, toCompositionChildren(item.trigger));
    const panelContent = createContentSlot(body, toCompositionChildren(item.panel));

    description.hidden = !hasDescription(item.description);

    heading.append(trigger);
    panel.append(description, body);
    element.append(heading, panel);

    return {
        element,
        heading,
        trigger,
        panel,
        description,
        body,
        triggerContent,
        panelContent,
        descriptionMode: item.descriptionMode ?? defaultDescriptionMode,
        ownDescriptionMode: item.descriptionMode,
        ownAnnouncement: item.announcement,
        originalTriggerDescribedBy: trigger.getAttribute("aria-describedby")
    };
}

function getResolvedItemAnnouncement(
    node: AccordionItemNodes,
    rootAnnouncement: DisclosureAnnouncement | undefined
): DisclosureAnnouncement | undefined {
    if (node.ownAnnouncement !== undefined) {
        return node.ownAnnouncement;
    }

    return getDescriptionAnnouncement(node.description) ?? rootAnnouncement;
}

function syncItemAnnouncement(
    item: Pick<AccordionItem, "disclosure">,
    node: AccordionItemNodes,
    rootAnnouncement: DisclosureAnnouncement | undefined
): void {
    item.disclosure.update({
        announcement: getResolvedItemAnnouncement(node, rootAnnouncement) ?? false
    });
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

            const itemAnnouncement = getResolvedItemAnnouncement(node, options.announcement);

            if (itemAnnouncement !== undefined) {
                itemOptions.announcement = itemAnnouncement;
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
    let descriptionMode: AccordionDescriptionMode = options.descriptionMode ?? "content";
    let rootAnnouncement = options.announcement;
    const itemNodes = options.items.map((item) => (
        createItemNodes(item, headingLevel, descriptionMode)
    ));

    let panelRole = options.panelRole ?? "auto";

    syncPanelSemantics(itemNodes, panelRole);
    itemNodes.forEach(syncTriggerDescription);

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
            description: node.description,
            body: node.body,

            setDescription(description): void {
                setItemDescription(node, description);
                syncItemAnnouncement(item, node, rootAnnouncement);
            },

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

            if (nextOptions.descriptionMode !== undefined) {
                descriptionMode = nextOptions.descriptionMode;

                for (const node of itemNodes) {
                    if (node.ownDescriptionMode === undefined) {
                        node.descriptionMode = descriptionMode;
                        syncTriggerDescription(node);
                    }
                }
            }

            if (nextOptions.announcement !== undefined) {
                rootAnnouncement = nextOptions.announcement;
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

                    let shouldSyncItemAnnouncement = false;

                    if (nextItem.descriptionId !== undefined) {
                        const previousDescriptionId = node.description.id;

                        removeTriggerDescriptionReference(node, previousDescriptionId);
                        node.description.id = nextItem.descriptionId;
                        syncTriggerDescription(node);
                    }

                    if ("description" in nextItem) {
                        setItemDescription(node, nextItem.description ?? null);
                        shouldSyncItemAnnouncement = true;
                    }

                    if (nextItem.descriptionMode !== undefined) {
                        node.ownDescriptionMode = nextItem.descriptionMode;
                        node.descriptionMode = nextItem.descriptionMode;
                        syncTriggerDescription(node);
                    }

                    if (nextItem.disabled !== undefined) {
                        item.setDisabled(nextItem.disabled);
                    }

                    if (nextItem.open !== undefined) {
                        item.setOpen(nextItem.open);
                    }

                    if (nextItem.announcement !== undefined) {
                        node.ownAnnouncement = nextItem.announcement;
                        item.disclosure.update({ announcement: nextItem.announcement });
                    } else if (shouldSyncItemAnnouncement) {
                        syncItemAnnouncement(item, node, rootAnnouncement);
                    }
                });
            }

            if (nextOptions.announcement !== undefined) {
                composedItems.forEach((item, index) => {
                    const node = itemNodes[index];

                    if (node && node.ownAnnouncement === undefined) {
                        syncItemAnnouncement(item, node, rootAnnouncement);
                    }
                });
            }
        },

        destroy(): void {
            for (const node of itemNodes) {
                removeTriggerDescriptionReference(node);
                node.triggerContent.dispose();
                node.panelContent.dispose();
            }

            accordion.destroy();
        }
    };

    return composed;
}
