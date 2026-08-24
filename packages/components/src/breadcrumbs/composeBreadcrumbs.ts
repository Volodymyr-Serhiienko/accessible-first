import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getElementText,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent,
    type ElementAttributes
} from "../composition";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";

/**
 * Content accepted by breadcrumb item labels.
 */
export type BreadcrumbsCompositionContent = CompositionContent;

/**
 * Values supported by aria-current for breadcrumb items.
 */
export type BreadcrumbsCurrent = boolean | "page" | "step" | "location" | "date" | "time";

/**
 * Visual variant for Breadcrumbs.
 */
export type BreadcrumbsVariant = "default" | "plain";

/**
 * Breadcrumbs size token.
 */
export type BreadcrumbsSize = "md";

/**
 * Localized message keys used by Breadcrumbs fallback labels.
 */
export type BreadcrumbsMessageKey = "breadcrumbs.label";

/**
 * Localization provider accepted by Breadcrumbs.
 */
export type BreadcrumbsLocalization = LocaleTextProvider<BreadcrumbsMessageKey>;

/**
 * One item accepted by Breadcrumbs().
 */
export interface BreadcrumbsItem {
    label: BreadcrumbsCompositionContent;
    href?: string | null;
    current?: BreadcrumbsCurrent;
    itemOptions?: BaseCompositionOptions;
    contentOptions?: BaseCompositionOptions;
}

/**
 * Options for Breadcrumbs().
 */
export interface BreadcrumbsOptions extends BaseCompositionOptions {
    items: BreadcrumbsItem[];
    /**
     * Accessible navigation label. Defaults to the localized breadcrumb label when omitted.
     */
    label?: string | null;
    /**
     * Id of visible text that labels the breadcrumb navigation.
     */
    labelledBy?: string | null;
    locale?: BreadcrumbsLocalization | null;
    separator?: string;
    variant?: BreadcrumbsVariant;
    size?: BreadcrumbsSize;
    listOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedBreadcrumbs.update().
 */
export interface BreadcrumbsUpdateOptions extends Partial<BreadcrumbsOptions> {}

/**
 * One composed breadcrumb item.
 */
export interface ComposedBreadcrumbsItem {
    readonly element: HTMLLIElement;
    readonly content: HTMLAnchorElement | HTMLSpanElement;
    readonly separator: HTMLElement | null;
    getText(): string;
    isCurrent(): boolean;
    setLabelContent(content: BreadcrumbsCompositionContent): void;
}

/**
 * Breadcrumb navigation created by the composition API.
 */
export interface ComposedBreadcrumbs extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly list: HTMLOListElement;
    readonly items: ComposedBreadcrumbsItem[];
    setLabel(label: string | null): void;
    setLabelledBy(labelledBy: string | null): void;
    setItems(items: BreadcrumbsItem[]): void;
    update(options: BreadcrumbsUpdateOptions): void;
    destroy(): void;
}

interface BreadcrumbsItemNode {
    element: HTMLLIElement;
    content: HTMLAnchorElement | HTMLSpanElement;
    separator: HTMLElement | null;
    contentSlot: ReturnType<typeof createContentSlot>;
}

function getAriaCurrentValue(
    item: BreadcrumbsItem,
    index: number,
    total: number
): string | null {
    const current = item.current ?? (index === total - 1 ? "page" : false);

    if (current === true) return "page";
    if (!current) return null;

    return current;
}

function getContentAttributes(
    item: BreadcrumbsItem,
    currentValue: string | null
): ElementAttributes {
    const attributes: ElementAttributes = {
        "data-af-breadcrumbs-content": ""
    };

    if (item.href !== undefined && item.href !== null) {
        attributes.href = item.href;
        attributes["data-af-breadcrumbs-link"] = "";
    }

    if (currentValue !== null) {
        attributes["aria-current"] = currentValue;
    }

    return attributes;
}

function createSeparatorElement(separatorText: string): HTMLElement {
    return createElement("span", {
        text: separatorText,
        attributes: {
            "data-af-breadcrumbs-separator": "",
            "aria-hidden": "true"
        }
    });
}

function syncItemSeparator(
    node: BreadcrumbsItemNode,
    index: number,
    total: number,
    separatorText: string
): void {
    const shouldShowSeparator = index < total - 1 && separatorText.length > 0;

    if (!shouldShowSeparator) {
        node.separator?.remove();
        node.separator = null;
        return;
    }

    if (!node.separator) {
        node.separator = createSeparatorElement(separatorText);
        node.element.append(node.separator);
        return;
    }

    node.separator.textContent = separatorText;
    node.separator.setAttribute("data-af-breadcrumbs-separator", "");
    node.separator.setAttribute("aria-hidden", "true");
}

function createItemNode(
    item: BreadcrumbsItem,
    index: number,
    total: number,
    separatorText: string
): BreadcrumbsItemNode {
    const element = createElement("li", getCompositionElementOptions(item.itemOptions, {
        "data-af-breadcrumbs-item": ""
    }));

    const currentValue = getAriaCurrentValue(item, index, total);
    const content = item.href !== undefined && item.href !== null
        ? createElement("a", getCompositionElementOptions(
            item.contentOptions,
            getContentAttributes(item, currentValue)
        ))
        : createElement("span", getCompositionElementOptions(
            item.contentOptions,
            getContentAttributes(item, currentValue)
        ));

    const contentSlot = createContentSlot(content, toCompositionChildren(item.label));
    const separator = index < total - 1 && separatorText
        ? createSeparatorElement(separatorText)
        : null;

    element.append(content);
    if (separator) element.append(separator);

    return {
        element,
        content,
        separator,
        contentSlot
    };
}

function destroyItemNode(node: BreadcrumbsItemNode): void {
    node.contentSlot.dispose();
}

function createComposedItem(node: BreadcrumbsItemNode): ComposedBreadcrumbsItem {
    return {
        element: node.element,
        content: node.content,

        get separator(): HTMLElement | null {
            return node.separator;
        },

        getText(): string {
            return getElementText(node.content);
        },

        isCurrent(): boolean {
            return node.content.hasAttribute("aria-current");
        },

        setLabelContent(content): void {
            node.contentSlot.set(toCompositionChildren(content));
        }
    };
}

function getFallbackLabel(locale: BreadcrumbsLocalization | null): string {
    return getLocaleText(
        locale,
        "breadcrumbs.label",
        accessibleFirstEnglishMessages["breadcrumbs.label"]
    );
}

function getNavigationLabel(
    label: string | null | undefined,
    locale: BreadcrumbsLocalization | null
): string | null {
    if (label === null) return null;

    return label ?? getFallbackLabel(locale);
}

/**
 * Creates semantic breadcrumb navigation.
 */
export function Breadcrumbs(options: BreadcrumbsOptions): ComposedBreadcrumbs {
    const element = createElement("nav", getCompositionElementOptions(options, {
        "data-af-composition": "breadcrumbs"
    }));

    const list = createElement("ol", getCompositionElementOptions(options.listOptions, {
        "data-af-breadcrumbs-list": ""
    }));

    element.append(list);

    const composedItems: ComposedBreadcrumbsItem[] = [];

    let itemDefinitions = options.items;
    let separator = options.separator ?? "/";
    let label = options.label;
    let labelledBy = options.labelledBy ?? null;
    let locale: BreadcrumbsLocalization | null = options.locale ?? null;
    let unsubscribeLocale: (() => void) | null = null;
    let variant: BreadcrumbsVariant = options.variant ?? "default";
    let size: BreadcrumbsSize = options.size ?? "md";
    let itemNodes: BreadcrumbsItemNode[] = [];

    function sync(): void {
        element.setAttribute("data-af-composition", "breadcrumbs");
        const resolvedLabel = getNavigationLabel(label, locale);
        const trimmedLabel = resolvedLabel?.trim() ?? "";
        const trimmedLabelledBy = labelledBy?.trim() ?? "";

        if (trimmedLabelledBy) {
            element.removeAttribute("aria-label");
            element.setAttribute("aria-labelledby", trimmedLabelledBy);
        } else if (trimmedLabel) {
            element.setAttribute("aria-label", trimmedLabel);
            element.removeAttribute("aria-labelledby");
        } else {
            element.removeAttribute("aria-label");
            element.removeAttribute("aria-labelledby");
        }

        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        list.setAttribute("data-af-breadcrumbs-list", "");
    }

    function setLabel(nextLabel: string | null): void {
        label = nextLabel;
        sync();
    }

    function setLabelledBy(nextLabelledBy: string | null): void {
        labelledBy = nextLabelledBy;
        sync();
    }

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        if (!locale?.subscribe) return;

        unsubscribeLocale = locale.subscribe(() => {
            sync();
        });
    }

    function disposeItems(): void {
        for (const node of [...itemNodes].reverse()) {
            destroyItemNode(node);
        }

        itemNodes = [];
        composedItems.splice(0, composedItems.length);
        list.replaceChildren();
    }

    function setItems(items: BreadcrumbsItem[]): void {
        itemDefinitions = items;
        disposeItems();

        itemNodes = itemDefinitions.map((item, index) => (
            createItemNode(item, index, itemDefinitions.length, separator)
        ));

        for (const node of itemNodes) {
            list.append(node.element);
            composedItems.push(createComposedItem(node));
        }

        sync();
    }

    function syncSeparators(): void {
        itemNodes.forEach((node, index) => {
            syncItemSeparator(node, index, itemNodes.length, separator);
        });
    }

    syncLocaleSubscription();
    setItems(itemDefinitions);

    return {
        element,
        list,
        items: composedItems,
        setLabel,
        setLabelledBy,
        setItems,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.listOptions !== undefined) {
                applyCompositionElementOptions(list, nextOptions.listOptions);
                list.setAttribute("data-af-breadcrumbs-list", "");
            }

            if ("label" in nextOptions) label = nextOptions.label;
            if ("labelledBy" in nextOptions) labelledBy = nextOptions.labelledBy ?? null;
            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                syncLocaleSubscription();
            }
            if (nextOptions.separator !== undefined) separator = nextOptions.separator;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            if (nextOptions.items !== undefined) {
                setItems(nextOptions.items);
            } else if (nextOptions.separator !== undefined) {
                syncSeparators();
            }

            sync();
        },

        destroy(): void {
            unsubscribeLocale?.();
            disposeItems();
        }
    };
}
