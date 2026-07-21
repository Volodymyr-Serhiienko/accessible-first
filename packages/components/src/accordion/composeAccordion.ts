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
    AccordionItem,
    AccordionItemOptions,
    AccordionOpenChangeDetail,
    AccordionOptions
} from "./types";

export type AccordionCompositionContent = CompositionChild | CompositionChild[];

export interface AccordionCompositionItem extends BaseCompositionOptions {
    value?: string;
    trigger: AccordionCompositionContent;
    panel: AccordionCompositionContent;
    disabled?: boolean;
    defaultOpen?: boolean;
    open?: boolean;
}

export interface AccordionCompositionOpenChangeDetail {
    value: string;
    open: boolean;
    item: ComposedAccordionItem;
}

export type AccordionCompositionOnOpenChange = (
    detail: AccordionCompositionOpenChangeDetail,
    accordion: ComposedAccordion
) => void;

export interface AccordionCompositionOptions
    extends Omit<AccordionOptions, "items" | "onOpenChange">,
        BaseCompositionOptions {
    items: AccordionCompositionItem[];
    onOpenChange?: AccordionCompositionOnOpenChange | null;
}

export interface ComposedAccordionItem
    extends Omit<AccordionItem, "element" | "trigger" | "panel"> {
    readonly element: HTMLElement;
    readonly trigger: HTMLButtonElement;
    readonly panel: HTMLElement;
    setTriggerContent(content: AccordionCompositionContent): void;
    setPanelContent(content: AccordionCompositionContent): void;
}

export interface ComposedAccordion
    extends Omit<AccordionInstance, "element" | "items" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly items: ComposedAccordionItem[];
    update(options: Partial<AccordionCompositionOptions>): void;
    destroy(): void;
}

interface AccordionItemNodes {
    element: HTMLElement;
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

function createItemNodes(item: AccordionCompositionItem): AccordionItemNodes {
    const element = createElement("div", getElementOptions(item));
    const trigger = createElement("button", {
        attributes: {
            type: "button"
        }
    });
    const panel = createElement("div");

    const triggerContent = createContentSlot(trigger, toChildren(item.trigger));
    const panelContent = createContentSlot(panel, toChildren(item.panel));

    element.append(trigger, panel);

    return {
        element,
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

            return itemOptions;
        }),
        onOpenChange
    };

    if (options.multiple !== undefined) {
        accordionOptions.multiple = options.multiple;
    }

    if (options.collapsible !== undefined) {
        accordionOptions.collapsible = options.collapsible;
    }

    if (options.disabled !== undefined) {
        accordionOptions.disabled = options.disabled;
    }

    if (options.loop !== undefined) {
        accordionOptions.loop = options.loop;
    }

    if (options.variant !== undefined) {
        accordionOptions.variant = options.variant;
    }

    if (options.size !== undefined) {
        accordionOptions.size = options.size;
    }

    return accordionOptions;
}

function getAccordionUpdateOptions(
    options: Partial<AccordionCompositionOptions>,
    onOpenChange: (detail: AccordionOpenChangeDetail) => void
): Partial<Omit<AccordionOptions, "items">> {
    const accordionOptions: Partial<Omit<AccordionOptions, "items">> = {};

    if (options.multiple !== undefined) {
        accordionOptions.multiple = options.multiple;
    }

    if (options.collapsible !== undefined) {
        accordionOptions.collapsible = options.collapsible;
    }

    if (options.disabled !== undefined) {
        accordionOptions.disabled = options.disabled;
    }

    if (options.loop !== undefined) {
        accordionOptions.loop = options.loop;
    }

    if (options.variant !== undefined) {
        accordionOptions.variant = options.variant;
    }

    if (options.size !== undefined) {
        accordionOptions.size = options.size;
    }

    if ("onOpenChange" in options) {
        accordionOptions.onOpenChange = onOpenChange;
    }

    return accordionOptions;
}

export function Accordion(options: AccordionCompositionOptions): ComposedAccordion {
    const element = createElement("div", getElementOptions(options));
    const itemNodes = options.items.map(createItemNodes);

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

        return {
            ...item,
            element: node!.element,
            trigger: node!.trigger,
            panel: node!.panel,

            setTriggerContent(content): void {
                node!.triggerContent.set(toChildren(content));
            },

            setPanelContent(content): void {
                node!.panelContent.set(toChildren(content));
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
