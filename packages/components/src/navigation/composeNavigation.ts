import {
    applyCompositionElementOptions,
    createElement,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent,
    type ElementAttributes
} from "../composition";
import { Link, type ComposedLink, type LinkCompositionOptions } from "../link";
import type { LinkCurrent, LinkTarget } from "../link";

/**
 * Content accepted by navigation item labels.
 */
export type NavigationCompositionContent = CompositionContent;

/**
 * aria-current value for navigation links.
 */
export type NavigationCurrent = LinkCurrent;

/**
 * Navigation layout direction.
 */
export type NavigationOrientation = "horizontal" | "vertical";

/**
 * Visual style variant for Navigation.
 */
export type NavigationVariant = "default" | "plain" | "pills";

/**
 * Navigation size token.
 */
export type NavigationSize = "md";

/**
 * Stable navigation item id, useful for SPA-style current-state updates.
 */
export type NavigationItemId = string;

/**
 * Link options passed through to the underlying Link component.
 */
export type NavigationItemLinkOptions = Omit<
    LinkCompositionOptions,
    "text" | "children" | "href" | "current" | "onNavigate"
>;

/**
 * Details passed when a navigation item is activated.
 */
export interface NavigationNavigateDetail {
    item: NavigationItem;
    index: number;
    event: Event;
}

/**
 * Called when a navigation item is activated.
 */
export type NavigationOnNavigate = (
    detail: NavigationNavigateDetail,
    navigation: ComposedNavigation
) => void;

/**
 * One item accepted by Navigation().
 */
export interface NavigationItem {
    id?: NavigationItemId;
    label: NavigationCompositionContent;
    href?: string | null;
    current?: NavigationCurrent;
    disabled?: boolean;
    external?: boolean;
    target?: LinkTarget | null;
    rel?: string | null;
    hint?: string | null;
    itemOptions?: BaseCompositionOptions;
    linkOptions?: NavigationItemLinkOptions;
    onNavigate?: NavigationOnNavigate | null;
}

/**
 * Options for Navigation().
 */
export interface NavigationOptions extends BaseCompositionOptions {
    items: NavigationItem[];
    orientation?: NavigationOrientation;
    variant?: NavigationVariant;
    size?: NavigationSize;
    onNavigate?: NavigationOnNavigate | null;
}

/**
 * Options accepted by ComposedNavigation.update().
 */
export interface NavigationUpdateOptions extends Partial<NavigationOptions> {}

/**
 * One rendered navigation item.
 */
export interface ComposedNavigationItem {
    readonly element: HTMLLIElement;
    readonly link: ComposedLink;
    readonly item: NavigationItem;
    setLabelContent(content: NavigationCompositionContent): void;
    isCurrent(): boolean;
}

/**
 * Navigation list created by the composition API.
 */
export interface ComposedNavigation extends ComposedNode<HTMLUListElement> {
    readonly element: HTMLUListElement;
    readonly items: ComposedNavigationItem[];
    setItems(items: NavigationItem[]): void;
    setCurrent(match: string | null): void;
    update(options: NavigationUpdateOptions): void;
    destroy(): void;
}

interface NavigationItemNode {
    element: HTMLLIElement;
    link: ComposedLink;
    definition: NavigationItem;
}

function getLinkAttributes(item: NavigationItem): ElementAttributes {
    return {
        ...(item.linkOptions?.attributes ?? {}),
        "data-af-navigation-link": ""
    };
}

function isCurrentMatch(item: NavigationItem, match: string): boolean {
    return item.id === match || item.href === match;
}

/**
 * Creates a semantic navigation list.
 *
 * Place it inside Page.navigation(...) or another named nav landmark.
 * Items use real links by default, so the same component works for MPA,
 * static, server-rendered, and SPA-style applications.
 */
export function Navigation(options: NavigationOptions): ComposedNavigation {
    const element = createElement("ul", getCompositionElementOptions(options, {
        "data-af-composition": "navigation",
        "data-af-navigation-list": ""
    }));

    const composedItems: ComposedNavigationItem[] = [];

    let itemDefinitions = options.items;
    let orientation: NavigationOrientation = options.orientation ?? "horizontal";
    let variant: NavigationVariant = options.variant ?? "default";
    let size: NavigationSize = options.size ?? "md";
    let onNavigate = options.onNavigate ?? null;
    let currentOverrideActive = false;
    let currentMatch: string | null = null;
    let itemNodes: NavigationItemNode[] = [];
    let composed!: ComposedNavigation;

    function getEffectiveCurrent(item: NavigationItem): NavigationCurrent {
        if (currentOverrideActive) {
            return currentMatch !== null && isCurrentMatch(item, currentMatch) ? "page" : false;
        }

        if ("current" in item) {
            return item.current ?? null;
        }

        return null;
    }

    function handleNavigate(event: Event, item: NavigationItem, index: number): void {
        const detail: NavigationNavigateDetail = {
            item,
            index,
            event
        };

        item.onNavigate?.(detail, composed);
        onNavigate?.(detail, composed);
    }

    function getItemLinkOptions(item: NavigationItem, index: number): LinkCompositionOptions {
        const linkOptions: LinkCompositionOptions = {
            ...item.linkOptions,
            attributes: getLinkAttributes(item),
            children: toCompositionChildren(item.label),
            variant: item.linkOptions?.variant ?? "standalone",
            current: getEffectiveCurrent(item),
            onNavigate(event) {
                handleNavigate(event, item, index);
            }
        };

        if ("href" in item) linkOptions.href = item.href ?? null;
        if (item.disabled !== undefined) linkOptions.disabled = item.disabled;
        if (item.external !== undefined) linkOptions.external = item.external;
        if ("target" in item) linkOptions.target = item.target ?? null;
        if ("rel" in item) linkOptions.rel = item.rel ?? null;
        if ("hint" in item) linkOptions.hint = item.hint ?? null;

        return linkOptions;
    }

    function createItemNode(item: NavigationItem, index: number): NavigationItemNode {
        const itemElement = createElement("li", getCompositionElementOptions(item.itemOptions, {
            "data-af-navigation-item": ""
        }));

        const link = Link(getItemLinkOptions(item, index));

        itemElement.append(link.element);

        return {
            element: itemElement,
            link,
            definition: item
        };
    }

    function createComposedItem(node: NavigationItemNode): ComposedNavigationItem {
        return {
            element: node.element,
            link: node.link,

            get item(): NavigationItem {
                return node.definition;
            },

            setLabelContent(content): void {
                node.link.update({
                    children: toCompositionChildren(content)
                });
            },

            isCurrent(): boolean {
                return node.link.element.hasAttribute("aria-current");
            }
        };
    }

    function sync(): void {
        element.setAttribute("data-af-composition", "navigation");
        element.setAttribute("data-af-navigation-list", "");
        element.setAttribute("data-af-orientation", orientation);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
    }

    function disposeItems(): void {
        for (const node of [...itemNodes].reverse()) {
            node.link.destroy();
        }

        itemNodes = [];
        composedItems.splice(0, composedItems.length);
        element.replaceChildren();
    }

    function setItems(items: NavigationItem[]): void {
        itemDefinitions = items;
        disposeItems();

        itemNodes = itemDefinitions.map(createItemNode);

        for (const node of itemNodes) {
            element.append(node.element);
            composedItems.push(createComposedItem(node));
        }

        sync();
    }

    function syncCurrentStates(): void {
        for (const node of itemNodes) {
            node.link.update({
                current: getEffectiveCurrent(node.definition)
            });
        }
    }

    function setCurrent(match: string | null): void {
        currentOverrideActive = true;
        currentMatch = match;
        syncCurrentStates();
    }

    setItems(itemDefinitions);

    composed = {
        element,
        items: composedItems,
        setItems,
        setCurrent,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.orientation !== undefined) orientation = nextOptions.orientation;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            if ("onNavigate" in nextOptions) {
                onNavigate = nextOptions.onNavigate ?? null;
            }

            if (nextOptions.items !== undefined) {
                setItems(nextOptions.items);
            } else {
                sync();
            }
        },

        destroy(): void {
            disposeItems();
        }
    };

    return composed;
}
