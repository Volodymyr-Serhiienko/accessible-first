import {
    createTabs as createTabsBehavior,
    type TabsOptions as CoreTabsOptions
} from "../../../core/src/tabs";
import { restoreAttribute } from "../../../core/src/dom";
import { createComponentLifecycle } from "../foundation";
import type { Tabs, TabsOptions, TabsSize, TabsUpdateOptions, TabsVariant } from "./types";

function getCoreTabsOptions(
    options: TabsOptions,
    onTabChange: (tab: HTMLElement, panel: HTMLElement) => void
): CoreTabsOptions {
    const coreOptions: CoreTabsOptions = {
        getTabs: options.getTabs,
        getPanel: options.getPanel,
        onTabChange
    };

    if (options.orientation !== undefined) coreOptions.orientation = options.orientation;
    if (options.activationMode !== undefined) coreOptions.activationMode = options.activationMode;
    if (options.loop !== undefined) coreOptions.loop = options.loop;
    if (options.defaultTab !== undefined) coreOptions.defaultTab = options.defaultTab;
    if (options.isTabDisabled !== undefined) coreOptions.isTabDisabled = options.isTabDisabled;

    return coreOptions;
}

/**
 * Enhances an existing tablist with Accessible First tabs behavior.
 *
 * The component layer adds styling/debug attributes and lifecycle cleanup while
 * the core tabs module manages ARIA state, roving focus, activation mode, and
 * panel visibility.
 */
export function createTabs(tablist: HTMLElement, options: TabsOptions): Tabs {
    const lifecycle = createComponentLifecycle(tablist, { name: "tabs" });

    const originalVariant = tablist.getAttribute("data-af-variant");
    const originalSize = tablist.getAttribute("data-af-size");
    const originalOrientation = tablist.getAttribute("data-af-orientation");
    const originalActivationMode = tablist.getAttribute("data-af-activation-mode");

    let variant: TabsVariant = options.variant ?? "default";
    let size: TabsSize = options.size ?? "md";
    let onTabChange = options.onTabChange ?? null;

    const coreOptions = getCoreTabsOptions(options, (tab, panel) => {
        onTabChange?.(tab, panel);
    });

    const tabs = createTabsBehavior(tablist, coreOptions);

    function syncAttributes(): void {
        tablist.setAttribute("data-af-variant", variant);
        tablist.setAttribute("data-af-size", size);
        tablist.setAttribute("data-af-orientation", options.orientation ?? "horizontal");
        tablist.setAttribute("data-af-activation-mode", options.activationMode ?? "automatic");
    }

    syncAttributes();

    lifecycle.addCleanup(() => {
        restoreAttribute(tablist, "data-af-variant", originalVariant);
        restoreAttribute(tablist, "data-af-size", originalSize);
        restoreAttribute(tablist, "data-af-orientation", originalOrientation);
        restoreAttribute(tablist, "data-af-activation-mode", originalActivationMode);
    });

    lifecycle.addCleanup(() => tabs.destroy());

    return {
        element: tablist,
        tablist,

        getCurrentTab: tabs.getCurrentTab,
        getCurrentPanel: tabs.getCurrentPanel,
        setCurrentTab: tabs.setCurrentTab,
        refresh: tabs.refresh,

        update(nextOptions: TabsUpdateOptions): void {
            if ("onTabChange" in nextOptions) onTabChange = nextOptions.onTabChange ?? null;
            if (nextOptions.getTabs !== undefined) coreOptions.getTabs = nextOptions.getTabs;
            if (nextOptions.getPanel !== undefined) coreOptions.getPanel = nextOptions.getPanel;
            if (nextOptions.loop !== undefined) coreOptions.loop = nextOptions.loop;
            if ("defaultTab" in nextOptions) coreOptions.defaultTab = nextOptions.defaultTab ?? null;
            if (nextOptions.isTabDisabled !== undefined) coreOptions.isTabDisabled = nextOptions.isTabDisabled;

            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            syncAttributes();
            tabs.refresh();
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
