import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getElementText,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";

/**
 * Content accepted by description list term and details slots.
 */
export type DescriptionListCompositionContent = CompositionContent;

/**
 * Visual layout for DescriptionList.
 */
export type DescriptionListLayout = "stacked" | "inline";

/**
 * Visual variant for DescriptionList.
 */
export type DescriptionListVariant = "default" | "plain";

/**
 * DescriptionList size token.
 */
export type DescriptionListSize = "md";

/**
 * One term/details pair accepted by DescriptionList().
 */
export interface DescriptionListItem {
    term: DescriptionListCompositionContent;
    details: DescriptionListCompositionContent;
    itemOptions?: BaseCompositionOptions;
    termOptions?: BaseCompositionOptions;
    detailsOptions?: BaseCompositionOptions;
}

/**
 * Options for DescriptionList().
 */
export interface DescriptionListOptions extends BaseCompositionOptions {
    items: DescriptionListItem[];
    layout?: DescriptionListLayout;
    variant?: DescriptionListVariant;
    size?: DescriptionListSize;
}

/**
 * Options accepted by ComposedDescriptionList.update().
 */
export interface DescriptionListUpdateOptions extends Partial<DescriptionListOptions> {}

/**
 * One composed description list item.
 */
export interface ComposedDescriptionListItem {
    readonly element: HTMLElement;
    readonly term: HTMLElement;
    readonly details: HTMLElement;
    getTermText(): string;
    getDetailsText(): string;
    setTermContent(content: DescriptionListCompositionContent): void;
    setDetailsContent(content: DescriptionListCompositionContent): void;
}

/**
 * Description list created by the composition API.
 */
export interface ComposedDescriptionList extends ComposedNode<HTMLDListElement> {
    readonly element: HTMLDListElement;
    readonly items: ComposedDescriptionListItem[];
    setItems(items: DescriptionListItem[]): void;
    update(options: DescriptionListUpdateOptions): void;
    destroy(): void;
}

interface DescriptionListItemNode {
    element: HTMLElement;
    term: HTMLElement;
    details: HTMLElement;
    termSlot: ReturnType<typeof createContentSlot>;
    detailsSlot: ReturnType<typeof createContentSlot>;
}

function createItemNode(item: DescriptionListItem): DescriptionListItemNode {
    const element = createElement("div", getCompositionElementOptions(item.itemOptions, {
        "data-af-description-list-item": ""
    }));

    const term = createElement("dt", getCompositionElementOptions(item.termOptions, {
        "data-af-description-list-term": ""
    }));

    const details = createElement("dd", getCompositionElementOptions(item.detailsOptions, {
        "data-af-description-list-details": ""
    }));

    const node: DescriptionListItemNode = {
        element,
        term,
        details,
        termSlot: createContentSlot(term, toCompositionChildren(item.term)),
        detailsSlot: createContentSlot(details, toCompositionChildren(item.details))
    };

    element.append(term, details);

    return node;
}

function destroyItemNode(node: DescriptionListItemNode): void {
    node.termSlot.dispose();
    node.detailsSlot.dispose();
}

function createComposedItem(node: DescriptionListItemNode): ComposedDescriptionListItem {
    return {
        element: node.element,
        term: node.term,
        details: node.details,

        getTermText(): string {
            return getElementText(node.term);
        },

        getDetailsText(): string {
            return getElementText(node.details);
        },

        setTermContent(content): void {
            node.termSlot.set(toCompositionChildren(content));
        },

        setDetailsContent(content): void {
            node.detailsSlot.set(toCompositionChildren(content));
        }
    };
}

/**
 * Creates a native description list for term/details content.
 */
export function DescriptionList(options: DescriptionListOptions): ComposedDescriptionList {
    const element = createElement("dl", getCompositionElementOptions(options, {
        "data-af-composition": "description-list"
    }));

    const composedItems: ComposedDescriptionListItem[] = [];

    let itemNodes: DescriptionListItemNode[] = [];
    let layout: DescriptionListLayout = options.layout ?? "stacked";
    let variant: DescriptionListVariant = options.variant ?? "default";
    let size: DescriptionListSize = options.size ?? "md";

    function sync(): void {
        element.setAttribute("data-af-composition", "description-list");
        element.setAttribute("data-af-layout", layout);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
    }

    function disposeItems(): void {
        for (const node of [...itemNodes].reverse()) {
            destroyItemNode(node);
        }

        itemNodes = [];
        composedItems.splice(0, composedItems.length);
        element.replaceChildren();
    }

    function setItems(items: DescriptionListItem[]): void {
        disposeItems();

        itemNodes = items.map(createItemNode);

        for (const node of itemNodes) {
            element.append(node.element);
            composedItems.push(createComposedItem(node));
        }

        sync();
    }

    setItems(options.items);

    return {
        element,
        items: composedItems,
        setItems,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.items !== undefined) {
                setItems(nextOptions.items);
            }

            if (nextOptions.layout !== undefined) layout = nextOptions.layout;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy(): void {
            disposeItems();
        }
    };
}
