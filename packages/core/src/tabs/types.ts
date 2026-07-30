/**
 * Tabs orientation used by arrow-key navigation.
 */
export type TabsOrientation = "horizontal" | "vertical";

/**
 * Tab activation behavior.
 */
export type TabsActivationMode = "automatic" | "manual";

/**
 * Tab reference.
 */
export type TabsTab =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Options for createTabs().
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
 * Controller returned by createTabs().
 */
export interface Tabs {
    readonly tablist: HTMLElement;
    getCurrentTab(): HTMLElement | null;
    getCurrentPanel(): HTMLElement | null;
    setCurrentTab(tab: HTMLElement | null, options?: { focus?: boolean }): boolean;
    refresh(): void;
    destroy(): void;
}
