import type {
    TabsActivationMode as CoreTabsActivationMode,
    TabsOptions as CoreTabsOptions,
    TabsOrientation as CoreTabsOrientation,
    TabsTab as CoreTabsTab
} from "../../../core/src/tabs";
import type { Component } from "../foundation";

/**
 * Visual variant for tabs.
 */
export type TabsVariant = "default" | "plain";

/**
 * Tabs size token.
 */
export type TabsSize = "md";

/**
 * Orientation used by tab arrow-key navigation.
 */
export type TabsOrientation = CoreTabsOrientation;

/**
 * Tab activation behavior.
 *
 * "automatic" selects a tab when it receives focus. "manual" waits for Enter
 * or Space after arrow-key focus movement.
 */
export type TabsActivationMode = CoreTabsActivationMode;

/**
 * Tab reference used for default tab selection.
 */
export type TabsTab = CoreTabsTab;

/**
 * Called when the selected tab changes.
 */
export type TabsOnChange = (tab: HTMLElement, panel: HTMLElement) => void;

/**
 * Options for createTabs().
 *
 * orientation and activationMode are creation-time options because the core
 * tabs behavior wires keyboard handling around them.
 */
export interface TabsOptions extends Omit<CoreTabsOptions, "onTabChange"> {
    variant?: TabsVariant;
    size?: TabsSize;
    onTabChange?: TabsOnChange | null;
}

/**
 * Options accepted by tabs.update().
 *
 * orientation and activationMode are intentionally excluded because they are
 * creation-time behavior options.
 */
export interface TabsUpdateOptions
    extends Partial<Omit<TabsOptions, "orientation" | "activationMode">> {}

/**
 * Tabs component controller returned by createTabs().
 */
export interface Tabs extends Component {
    readonly tablist: HTMLElement;
    getCurrentTab(): HTMLElement | null;
    getCurrentPanel(): HTMLElement | null;
    setCurrentTab(tab: HTMLElement | null, options?: { focus?: boolean }): boolean;
    refresh(): void;
    update(options: TabsUpdateOptions): void;
}
