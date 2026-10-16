import {
    applyCompositionElementOptions,
    createElement,
    createContentSlot,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent,
    type ElementAttributes
} from "../composition";
import { Link, type ComposedLink, type LinkCompositionOptions } from "../link";
import type { LinkCurrent, LinkTarget } from "../link";
import { runCleanups } from "../../../core/src/events";

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
    /** Creates independently owned leading content before the ordinary links. */
    leadingContent?: (() => CompositionContent) | null;
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

    let itemDefinitions = [...options.items];
    let leadingContent = options.leadingContent ?? null;
    const content = createContentSlot(element);
    let orientation: NavigationOrientation = options.orientation ?? "horizontal";
    let variant: NavigationVariant = options.variant ?? "default";
    let size: NavigationSize = options.size ?? "md";
    let onNavigate = options.onNavigate ?? null;
    let currentOverrideActive = false;
    let currentMatch: string | null = null;
    let itemNodes: NavigationItemNode[] = [];
    let destroyed = false;
    let revision = 0;
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
        if (destroyed) return;
        const current = revision;
        const detail: NavigationNavigateDetail = {
            item,
            index,
            event
        };

        item.onNavigate?.(detail, composed);
        if (!destroyed && current === revision) onNavigate?.(detail, composed);
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
                if (destroyed || !itemNodes.includes(node)) return;
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
        if (destroyed) return;
        element.setAttribute("data-af-composition", "navigation");
        element.setAttribute("data-af-navigation-list", "");
        element.setAttribute("data-af-orientation", orientation);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
    }

    function setItems(items: NavigationItem[]): void {
        if (destroyed) return;
        const current = ++revision;
        itemDefinitions = [...items];
        const definitions = itemDefinitions;
        const children: ComposedNode[] = [];
        const nodes: NavigationItemNode[] = [];
        let committed = false;
        const discard = (): void => {
            if (committed) return;
            committed = true;
            runCleanups(children.reverse().map(child => () => child.destroy?.()));
        };

        try {
            if (leadingContent) {
                const control = createElement("li", {
                    attributes: { "data-af-navigation-item": "", "data-af-navigation-control": "" }
                });
                const slot = createContentSlot(control, toCompositionChildren(leadingContent()));
                children.push({ element: control, destroy: slot.dispose });
            }
            for (const [index, item] of definitions.entries()) {
                if (destroyed || current !== revision) return;
                const node = createItemNode(item, index);
                nodes.push(node);
                children.push({ element: node.element, destroy: () => node.link.destroy() });
            }
            if (destroyed || current !== revision) return;
            itemNodes = nodes;
            composedItems.splice(0, composedItems.length, ...nodes.map(createComposedItem));
            committed = true;
            runCleanups([() => content.set(children), sync]);
        } catch (error) {
            runCleanups([() => { throw error; }, discard]);
        } finally { discard(); }
    }

    function syncCurrentStates(): void {
        for (const node of itemNodes) {
            node.link.update({
                current: getEffectiveCurrent(node.definition)
            });
        }
    }

    function setCurrent(match: string | null): void {
        if (destroyed) return;
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
            if (destroyed) return;
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.orientation !== undefined) orientation = nextOptions.orientation;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            if ("onNavigate" in nextOptions) {
                onNavigate = nextOptions.onNavigate ?? null;
            }

            if ("leadingContent" in nextOptions) leadingContent = nextOptions.leadingContent ?? null;

            if (nextOptions.items !== undefined) {
                setItems(nextOptions.items);
            } else if ("leadingContent" in nextOptions) {
                setItems(itemDefinitions);
            } else {
                sync();
            }
        },

        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            revision += 1;
            itemNodes = [];
            composedItems.splice(0, composedItems.length);
            runCleanups([content.dispose, () => element.replaceChildren()]);
        }
    };

    return composed;
}
