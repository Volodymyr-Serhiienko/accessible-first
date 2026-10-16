import { setRole } from "../../../core/src/aria";
import { createAriaReferenceOwner } from "../../../core/src/aria/createAriaReferenceOwner";
import { runCleanups } from "../../../core/src/events";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getElementText,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent
} from "../composition";
import { createId } from "../../../core/src/id";
import { createAccordion } from "./createAccordion";
import type { DisclosureAnnouncement, DisclosureDescriptionMode } from "../disclosure";
import type {
    Accordion as AccordionInstance,
    AccordionHeadingLevel,
    AccordionItem,
    AccordionItemOptions,
    AccordionOpenChangeDetail,
    AccordionOptions,
    AccordionPanelRole,
    AccordionUpdateOptions
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
    descriptionReference: ReturnType<typeof createAriaReferenceOwner>;
    panelLabelReference: ReturnType<typeof createAriaReferenceOwner>;
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
    return getElementText(description);
}

function getDescriptionAnnouncement(description: HTMLElement): DisclosureAnnouncement | undefined {
    const text = getDescriptionText(description);

    return text || undefined;
}

function shouldUseAriaDescription(
    mode: AccordionDescriptionMode,
    description: HTMLElement
): boolean {
    return mode === "aria" && Boolean(getDescriptionText(description));
}

function syncTriggerDescription(node: AccordionItemNodes): void {
    node.descriptionReference.set(shouldUseAriaDescription(node.descriptionMode, node.description) ? [node.description.id] : []);
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
            if (!node.trigger.id) node.trigger.id = createId("af-accordion-trigger");
            node.panelLabelReference.set([node.trigger.id]);
        } else {
            setRole(node.panel, null);
            node.panelLabelReference.set([]);
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

    const triggerContent = createContentSlot(trigger);
    const panelContent = createContentSlot(body);
    const descriptionReference = createAriaReferenceOwner(trigger, "aria-describedby");
    const panelLabelReference = createAriaReferenceOwner(panel, "aria-labelledby");
    try {
        triggerContent.set(toCompositionChildren(item.trigger));
        panelContent.set(toCompositionChildren(item.panel));
    } catch (error) {
        runCleanups([() => { throw error; }, triggerContent.dispose, panelContent.dispose,
            descriptionReference.destroy, panelLabelReference.destroy]);
    }

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
        descriptionReference,
        panelLabelReference
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
): AccordionUpdateOptions {
    const accordionOptions: AccordionUpdateOptions = {};

    if (options.multiple !== undefined) accordionOptions.multiple = options.multiple;
    if (options.collapsible !== undefined) accordionOptions.collapsible = options.collapsible;
    if (options.disabled !== undefined) accordionOptions.disabled = options.disabled;
    if (options.loop !== undefined) accordionOptions.loop = options.loop;
    if (options.variant !== undefined) accordionOptions.variant = options.variant;
    if (options.size !== undefined) accordionOptions.size = options.size;

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
    const itemNodes: AccordionItemNodes[] = [];
    function disposeContent(): void {
        runCleanups(itemNodes.flatMap(node => [node.triggerContent.dispose, node.panelContent.dispose,
            node.descriptionReference.destroy, node.panelLabelReference.destroy]));
    }
    try {
        for (const item of options.items) itemNodes.push(createItemNodes(item, headingLevel, descriptionMode));
    } catch (error) { runCleanups([() => { throw error; }, disposeContent]); }

    let panelRole = options.panelRole ?? "auto";

    syncPanelSemantics(itemNodes, panelRole);
    itemNodes.forEach(syncTriggerDescription);

    for (const item of itemNodes) {
        element.append(item.element);
    }

    let composed!: ComposedAccordion;
    let composedItems: ComposedAccordionItem[] = [];
    let onOpenChange = options.onOpenChange ?? null;
    let destroyed = false;
    let revision = 0;

    const handleOpenChange = (detail: AccordionOpenChangeDetail): void => {
        const item = composedItems.find((candidate) => candidate.value === detail.value);

        if (destroyed || !item) {
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

    let accordion: AccordionInstance;
    try { accordion = createAccordion(element, getAccordionOptions(options, itemNodes, handleOpenChange)); }
    catch (error) { runCleanups([() => { throw error; }, disposeContent]); throw error; }

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
                if (destroyed || accordion.isDestroyed()) return;
                revision += 1;
                setItemDescription(node, description);
                syncItemAnnouncement(item, node, rootAnnouncement);
            },

            setTriggerContent(content): void {
                if (destroyed || accordion.isDestroyed()) return;
                revision += 1;
                node.triggerContent.set(toCompositionChildren(content));
            },

            setPanelContent(content): void {
                if (destroyed || accordion.isDestroyed()) return;
                revision += 1;
                node.panelContent.set(toCompositionChildren(content));
            }
        };
    });

    function update(nextOptions: AccordionCompositionUpdateOptions): void {
        if (destroyed || accordion.isDestroyed()) return;
        const current = ++revision;
        const active = (): boolean => !destroyed && !accordion.isDestroyed() && current === revision;
        applyCompositionElementOptions(element, nextOptions);
        if ("onOpenChange" in nextOptions) onOpenChange = nextOptions.onOpenChange ?? null;
        if (nextOptions.panelRole !== undefined) panelRole = nextOptions.panelRole;
        if (nextOptions.descriptionMode !== undefined) descriptionMode = nextOptions.descriptionMode;
        if (nextOptions.announcement !== undefined) rootAnnouncement = nextOptions.announcement;
        // Prepare content and feedback before state changes can call application code.
        const work: Array<() => void> = [];
        for (const [index, node] of itemNodes.entries()) {
            const next = nextOptions.items?.[index];
            if (node.ownDescriptionMode === undefined) node.descriptionMode = descriptionMode;
            if (next) {
                applyCompositionElementOptions(node.element, next);
                if (next.descriptionId !== undefined) node.description.id = next.descriptionId || createId("af-accordion-description");
                if (next.descriptionMode !== undefined) {
                    node.ownDescriptionMode = next.descriptionMode;
                    node.descriptionMode = next.descriptionMode;
                }
                if ("description" in next) setItemDescription(node, next.description ?? null);
                if (next.announcement !== undefined) node.ownAnnouncement = next.announcement;
                work.push(
                    () => { if (active() && next.trigger !== undefined) node.triggerContent.set(toCompositionChildren(next.trigger)); },
                    () => { if (active() && next.panel !== undefined) node.panelContent.set(toCompositionChildren(next.panel)); }
                );
            }
            syncTriggerDescription(node);
        }
        syncPanelSemantics(itemNodes, panelRole);
        work.push(() => {
            if (!active()) return;
            for (const [index, item] of composedItems.entries()) {
                if (!active()) return;
                const node = itemNodes[index]!;
                syncItemAnnouncement(item, node, rootAnnouncement);
                const disabled = nextOptions.items?.[index]?.disabled;
                if (disabled !== undefined) item.setDisabled(disabled);
            }
        });
        work.push(() => { if (active()) accordion.update(getAccordionUpdateOptions(nextOptions, handleOpenChange)); });
        for (const [index, next] of (nextOptions.items ?? []).entries()) {
            work.push(() => { if (active() && next?.open !== undefined) composedItems[index]?.setOpen(next.open); });
        }
        runCleanups(work);
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        runCleanups([accordion.destroy, disposeContent]);
    }

    composed = {
        ...accordion,
        element,
        items: composedItems,

        update,
        destroy
    };

    return composed;
}
