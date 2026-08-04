import { createId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent
} from "../composition";
import { createTabs as createTabsComponent } from "./createTabs";
import { createHoverAnnouncement } from "../foundation";
import type {
    Tabs as TabsInstance,
    TabsActivationMode,
    TabsOptions as TabsInstanceOptions,
    TabsOrientation,
    TabsSize,
    TabsUpdateOptions as TabsInstanceUpdateOptions,
    TabsVariant
} from "./types";

/**
 * Content accepted by tab labels and tab panels.
 */
export type TabsCompositionContent = CompositionContent;

/**
 * One item accepted by Tabs().
 */
export interface TabsCompositionItem {
    value?: string;
    tab: TabsCompositionContent;
    panel: TabsCompositionContent;
    disabled?: boolean;
    defaultSelected?: boolean;
    tabOptions?: BaseCompositionOptions;
    panelOptions?: BaseCompositionOptions;
    announceOnHover?: boolean;
    hoverAnnouncement?: string | null;
}

/**
 * Partial item update accepted by tabs.update({ items }).
 *
 * value is creation-time only. Use tabs.setCurrentValue(value) or update({ value })
 * to change the selected tab.
 */
export interface TabsCompositionItemUpdate {
    tab?: TabsCompositionContent;
    panel?: TabsCompositionContent;
    disabled?: boolean;
    tabOptions?: BaseCompositionOptions;
    panelOptions?: BaseCompositionOptions;
    announceOnHover?: boolean;
    hoverAnnouncement?: string | null;
}

/**
 * Details passed when the selected composed tab changes.
 */
export interface TabsCompositionChangeDetail {
    value: string;
    tab: HTMLButtonElement;
    panel: HTMLElement;
    item: ComposedTabsItem;
}

/**
 * Called when the selected composed tab changes.
 */
export type TabsCompositionOnChange = (
    detail: TabsCompositionChangeDetail,
    tabs: ComposedTabs
) => void;

/**
 * Options for Tabs().
 */
export interface TabsCompositionOptions
    extends Omit<
            TabsInstanceOptions,
            "getTabs" | "getPanel" | "defaultTab" | "isTabDisabled" | "onTabChange"
        >,
        BaseCompositionOptions {
    items: TabsCompositionItem[];
    value?: string;
    defaultValue?: string;
    orientation?: TabsOrientation;
    activationMode?: TabsActivationMode;
    variant?: TabsVariant;
    size?: TabsSize;
    announceOnHover?: boolean;
    onTabChange?: TabsCompositionOnChange | null;
}

/**
 * Options accepted by ComposedTabs.update().
 *
 * orientation, activationMode, and defaultValue are creation-time options.
 */
export interface TabsCompositionUpdateOptions
    extends Partial<
        Omit<TabsCompositionOptions, "items" | "orientation" | "activationMode" | "defaultValue">
    > {
    items?: TabsCompositionItemUpdate[];
}

/**
 * One tab and panel pair created by the composition API.
 */
export interface ComposedTabsItem {
    readonly value: string;
    readonly tab: HTMLButtonElement;
    readonly panel: HTMLElement;
    setTabContent(content: TabsCompositionContent): void;
    setPanelContent(content: TabsCompositionContent): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
}

/**
 * Tabs created by the composition API.
 */
export interface ComposedTabs
    extends Omit<TabsInstance, "element" | "tablist" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly tablist: HTMLElement;
    readonly panels: HTMLElement;
    readonly items: ComposedTabsItem[];
    getItem(value: string): ComposedTabsItem | null;
    getCurrentItem(): ComposedTabsItem | null;
    getCurrentValue(): string | null;
    setCurrentValue(value: string, options?: { focus?: boolean }): boolean;
    update(options: TabsCompositionUpdateOptions): void;
    destroy(): void;
}

interface TabsItemNode {
    value: string;
    tab: HTMLButtonElement;
    panel: HTMLElement;
    tabContent: ReturnType<typeof createContentSlot>;
    panelContent: ReturnType<typeof createContentSlot>;
    hoverAnnouncement: ReturnType<typeof createHoverAnnouncement>;
    announceOnHover: boolean | undefined;
    disabled: boolean;
}

function getUniqueValue(
    item: TabsCompositionItem,
    index: number,
    usedValues: Set<string>
): string {
    const baseValue = item.value ?? item.tabOptions?.id ?? `tab-${index + 1}`;
    let value = baseValue;
    let suffix = 2;

    while (usedValues.has(value)) {
        value = `${baseValue}-${suffix++}`;
    }

    usedValues.add(value);
    return value;
}

function syncItemDisabled(node: TabsItemNode, disabled: boolean): void {
    node.disabled = disabled;
    node.tab.disabled = disabled;

    if (disabled) {
        node.tab.setAttribute("aria-disabled", "true");
        node.tab.setAttribute("data-af-disabled", "true");
    } else {
        node.tab.removeAttribute("aria-disabled");
        node.tab.removeAttribute("data-af-disabled");
    }
}

function applyTabOptions(tab: HTMLButtonElement, options: BaseCompositionOptions | undefined): void {
    applyCompositionElementOptions(tab, options);
    tab.type = "button";
    tab.setAttribute("data-af-tabs-tab", "");
}

function applyPanelOptions(panel: HTMLElement, options: BaseCompositionOptions | undefined): void {
    applyCompositionElementOptions(panel, options);
    panel.setAttribute("data-af-tabs-panel", "");
}

function createItemNodes(
    items: TabsCompositionItem[],
    rootAnnounceOnHover: boolean
): TabsItemNode[] {
    const usedValues = new Set<string>();

    return items.map((item, index): TabsItemNode => {
        const value = getUniqueValue(item, index, usedValues);

        const tab = createElement("button", getCompositionElementOptions(
            item.tabOptions,
            {
                type: "button",
                "data-af-tabs-tab": ""
            }
        ));

        const panel = createElement("div", getCompositionElementOptions(
            item.panelOptions,
            {
                "data-af-tabs-panel": ""
            }
        ));

        if (!tab.id) tab.id = createId("af-tab");
        if (!panel.id) panel.id = createId("af-tab-panel");

        const node: TabsItemNode = {
            value,
            tab,
            panel,
            tabContent: createContentSlot(tab, toCompositionChildren(item.tab)),
            panelContent: createContentSlot(panel, toCompositionChildren(item.panel)),
            hoverAnnouncement: createHoverAnnouncement(tab, {
                message: item.hoverAnnouncement ?? undefined,
                enabled: item.announceOnHover ?? rootAnnounceOnHover
            }),
            announceOnHover: item.announceOnHover,
            disabled: false
        };

        syncItemDisabled(node, item.disabled ?? false);

        return node;
    });
}

function getDefaultTab(
    options: TabsCompositionOptions,
    itemNodes: TabsItemNode[]
): HTMLElement | null {
    const selectedValue = options.value ?? options.defaultValue;

    if (selectedValue !== undefined) {
        return itemNodes.find((node) => node.value === selectedValue && !node.disabled)?.tab ?? null;
    }

    const selectedIndex = options.items.findIndex((item) => item.defaultSelected === true);
    const selectedNode = selectedIndex >= 0 ? itemNodes[selectedIndex] : null;

    return selectedNode && !selectedNode.disabled ? selectedNode.tab : null;
}

function getTabsOptions(
    options: TabsCompositionOptions,
    itemNodes: TabsItemNode[],
    onTabChange: (tab: HTMLElement, panel: HTMLElement) => void
): TabsInstanceOptions {
    const tabsOptions: TabsInstanceOptions = {
        getTabs: () => itemNodes.map((node) => node.tab),
        getPanel: (tab) => itemNodes.find((node) => node.tab === tab)?.panel ?? null,
        isTabDisabled: (tab) => itemNodes.find((node) => node.tab === tab)?.disabled ?? tab.hasAttribute("disabled"),
        onTabChange
    };

    const defaultTab = getDefaultTab(options, itemNodes);

    if (defaultTab) tabsOptions.defaultTab = defaultTab;
    if (options.orientation !== undefined) tabsOptions.orientation = options.orientation;
    if (options.activationMode !== undefined) tabsOptions.activationMode = options.activationMode;
    if (options.loop !== undefined) tabsOptions.loop = options.loop;
    if (options.variant !== undefined) tabsOptions.variant = options.variant;
    if (options.size !== undefined) tabsOptions.size = options.size;

    return tabsOptions;
}

function getTabsUpdateOptions(
    options: TabsCompositionUpdateOptions
): TabsInstanceUpdateOptions {
    const tabsOptions: TabsInstanceUpdateOptions = {};

    if (options.loop !== undefined) tabsOptions.loop = options.loop;
    if (options.variant !== undefined) tabsOptions.variant = options.variant;
    if (options.size !== undefined) tabsOptions.size = options.size;

    return tabsOptions;
}

/**
 * Creates an accessible tabs component with tab buttons and linked panels.
 */
export function Tabs(options: TabsCompositionOptions): ComposedTabs {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "tabs",
        "data-af-orientation": options.orientation ?? "horizontal",
        "data-af-activation-mode": options.activationMode ?? "automatic"
    }));

    const tablist = createElement("div", {
        attributes: {
            "data-af-tabs-tablist": ""
        }
    });

    const panels = createElement("div", {
        attributes: {
            "data-af-tabs-panels": ""
        }
    });

    let announceOnHover = options.announceOnHover ?? true;

    const itemNodes = createItemNodes(options.items, announceOnHover);

    for (const node of itemNodes) {
        tablist.append(node.tab);
        panels.append(node.panel);
    }

    element.append(tablist, panels);

    let composed!: ComposedTabs;
    let composedItems: ComposedTabsItem[] = [];
    let onTabChange = options.onTabChange ?? null;

    const handleTabChange = (tab: HTMLElement, panel: HTMLElement): void => {
        const item = composedItems.find((candidate) => candidate.tab === tab);

        if (!item) return;

        onTabChange?.(
            {
                value: item.value,
                tab: item.tab,
                panel,
                item
            },
            composed
        );
    };

    const tabs = createTabsComponent(
        tablist,
        getTabsOptions(options, itemNodes, handleTabChange)
    );

    function getItem(value: string): ComposedTabsItem | null {
        return composedItems.find((item) => item.value === value) ?? null;
    }

    function getCurrentItem(): ComposedTabsItem | null {
        const currentTab = tabs.getCurrentTab();

        return composedItems.find((item) => item.tab === currentTab) ?? null;
    }

    function setCurrentValue(value: string, setOptions: { focus?: boolean } = {}): boolean {
        return tabs.setCurrentTab(getItem(value)?.tab ?? null, setOptions);
    }

    composedItems = itemNodes.map((node): ComposedTabsItem => ({
        value: node.value,
        tab: node.tab,
        panel: node.panel,

        setTabContent(content): void {
            node.tabContent.set(toCompositionChildren(content));
        },

        setPanelContent(content): void {
            node.panelContent.set(toCompositionChildren(content));
        },

        setDisabled(disabled): void {
            syncItemDisabled(node, disabled);
            tabs.refresh();
        },

        isDisabled(): boolean {
            return node.disabled;
        }
    }));

    composed = {
        element,
        tablist,
        panels,
        items: composedItems,

        getCurrentTab: tabs.getCurrentTab,
        getCurrentPanel: tabs.getCurrentPanel,
        setCurrentTab: tabs.setCurrentTab,
        refresh: tabs.refresh,
        getItem,
        getCurrentItem,

        getCurrentValue(): string | null {
            return getCurrentItem()?.value ?? null;
        },

        setCurrentValue,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("onTabChange" in nextOptions) {
                onTabChange = nextOptions.onTabChange ?? null;
            }

            if (nextOptions.announceOnHover !== undefined) {
                announceOnHover = nextOptions.announceOnHover;

                for (const node of itemNodes) {
                    node.hoverAnnouncement.setEnabled(node.announceOnHover ?? announceOnHover);
                }
            }

            if (nextOptions.items !== undefined) {
                nextOptions.items.forEach((nextItem, index) => {
                    const node = itemNodes[index];
                    const item = composedItems[index];

                    if (!node || !item) return;

                    if (nextItem.tabOptions !== undefined) {
                        applyTabOptions(node.tab, nextItem.tabOptions);
                    }

                    if (nextItem.panelOptions !== undefined) {
                        applyPanelOptions(node.panel, nextItem.panelOptions);
                    }

                    if (nextItem.tab !== undefined) {
                        item.setTabContent(nextItem.tab);
                    }

                    if (nextItem.panel !== undefined) {
                        item.setPanelContent(nextItem.panel);
                    }

                    if (nextItem.disabled !== undefined) {
                        item.setDisabled(nextItem.disabled);
                    }

                    if ("hoverAnnouncement" in nextItem) {
                        node.hoverAnnouncement.setMessage(nextItem.hoverAnnouncement ?? undefined);
                    }

                    if (nextItem.announceOnHover !== undefined) {
                        node.announceOnHover = nextItem.announceOnHover;
                        node.hoverAnnouncement.setEnabled(node.announceOnHover ?? announceOnHover);
                    }
                });
            }

            tabs.update(getTabsUpdateOptions(nextOptions));

            if (nextOptions.value !== undefined) {
                setCurrentValue(nextOptions.value);
            }
        },

        destroy(): void {
            for (const node of itemNodes) {
                node.tabContent.dispose();
                node.panelContent.dispose();
                node.hoverAnnouncement.destroy();
            }

            tabs.destroy();
        },

        isDestroyed(): boolean {
            return tabs.isDestroyed();
        }
    };

    return composed;
}
    