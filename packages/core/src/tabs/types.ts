/**
 * Specifies the visual layout alignment of the tab group.
 * Dictates which arrow keys navigate the selections.
 */
export type TabsOrientation = "horizontal" | "vertical";

/**
 * Determines the interaction model for showing tab panels.
 * - "automatic": Displaying a tab panel occurs immediately on arrow selection focus.
 * - "manual": Tab panels are only shown when explicitly activated (e.g., via Space or Enter keys).
 */
export type TabsActivationMode = "automatic" | "manual";

/**
 * A proxy reference resolving to a single tab trigger.
 * Can be an actual `HTMLElement`, a dynamic factory function, or null.
 */
export type TabsTab =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Configuration options for initializing a tabs system manager.
 */
export interface TabsOptions {
    getTabs: () => HTMLElement[];
    getPanel: (tab: HTMLElement) => HTMLElement | null;
    orientation?: TabsOrientation;
    activationMode?: TabsActivationMode;
    loop?: boolean;
    defaultTab?: TabsTab;
    isTabDisabled?: (tab: HTMLElement) => boolean;
    onTabChange?: (tab: HTMLElement, panel: HTMLElement) => void;
}

/**
 * Interface representing a managed tabs collection.
 * Orchestrates keyboard layout patterns, roving tab indexes, and conditional panel visibility 
 * according to WAI-ARIA Authoring Practices for Tabs.
 */
export interface Tabs {
    readonly tablist: HTMLElement;
    getCurrentTab(): HTMLElement | null;
    getCurrentPanel(): HTMLElement | null;
    setCurrentTab(tab: HTMLElement | null, options?: { focus?: boolean }): boolean;
    refresh(): void;
    destroy(): void;
}
