import {
    setAriaAttribute,
    setAriaControls,
    setAriaLabelledBy,
    setRole
} from "../aria";
import { getFirstItem } from "../collection";
import { addEventListener, type Cleanup } from "../events";
import { isEnterKey, isSpaceKey } from "../keyboard";
import {
    createRovingFocus,
    isRovingFocusItemDisabled,
    type RovingFocus,
    type RovingFocusOptions
} from "../roving-focus";
import type { Tabs, TabsOptions, TabsTab } from "./types";

function resolveTab(tab: TabsTab | undefined): HTMLElement | null {
    return typeof tab === "function" ? tab() : tab ?? null;
}

function isNode(value: EventTarget | null): value is Node {
    return typeof value === "object" && value !== null && "nodeType" in value;
}

function restoreAttribute(
    element: HTMLElement,
    name: string,
    value: string | null
): void {
    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
}

/**
 * Creates and initializes an accessible tabs management system component.
 * Orchestrates a group of tab controls (`tablist` and `tab` elements) and their corresponding content areas (`tabpanel` elements)
 * according to WAI-ARIA Authoring Practices, featuring roving index tracking, selective auto/manual activation modes, 
 * and absolute state restoration on destruction.
 *
 * @param tablist - The parent context element containing the clickable or focusable tab triggers.
 * @param options - Core dependency resolution rules, keyboard navigation behavior overrides, and active visibility hooks.
 * @returns A Tabs lifecycle instance providing operational accessors and teardown APIs.
 */
export function createTabs(
    tablist: HTMLElement,
    options: TabsOptions
): Tabs {
    const orientation = options.orientation ?? "horizontal";
    const activationMode = options.activationMode ?? "automatic";

    const originalAttributes = new Map<HTMLElement, Map<string, string | null>>();

    let currentTab: HTMLElement | null = null;
    let destroyed = false;
    let rovingFocus: RovingFocus;

    function rememberAttribute(element: HTMLElement, name: string): void {
        let attributes = originalAttributes.get(element);

        if (!attributes) {
            attributes = new Map<string, string | null>();
            originalAttributes.set(element, attributes);
        }

        if (!attributes.has(name)) {
            attributes.set(name, element.getAttribute(name));
        }
    }

    function restoreAttributes(): void {
        for (const [element, attributes] of originalAttributes) {
            for (const [name, value] of attributes) {
                restoreAttribute(element, name, value);
            }
        }

        originalAttributes.clear();
    }

    function getTabs(): HTMLElement[] {
        return options.getTabs();
    }

    function getPanel(tab: HTMLElement): HTMLElement | null {
        return options.getPanel(tab);
    }

    function isTabDisabled(tab: HTMLElement): boolean {
        return options.isTabDisabled?.(tab) ?? isRovingFocusItemDisabled(tab);
    }

    function isTabAvailable(tab: HTMLElement): boolean {
        return getTabs().includes(tab) && !isTabDisabled(tab) && getPanel(tab) !== null;
    }

    function getInitialTab(): HTMLElement | null {
        const defaultTab = resolveTab(options.defaultTab);

        if (defaultTab && isTabAvailable(defaultTab)) {
            return defaultTab;
        }

        const selectedTab = getTabs().find((tab) => (
            tab.getAttribute("aria-selected") === "true" &&
            isTabAvailable(tab)
        ));

        if (selectedTab) {
            return selectedTab;
        }

        return getFirstItem(getTabs(), {
            isItemDisabled: (tab) => !isTabAvailable(tab)
        });
    }

    function getTabFromEventTarget(target: EventTarget | null): HTMLElement | null {
        if (!isNode(target)) {
            return null;
        }

        return getTabs().find((tab) => tab === target || tab.contains(target)) ?? null;
    }

    function syncState(): void {
        rememberAttribute(tablist, "role");
        rememberAttribute(tablist, "aria-orientation");

        setRole(tablist, "tablist");
        setAriaAttribute(
            tablist,
            "aria-orientation",
            orientation === "vertical" ? "vertical" : null
        );

        for (const tab of getTabs()) {
            const panel = getPanel(tab);
            const selected = tab === currentTab && panel !== null;

            rememberAttribute(tab, "role");
            rememberAttribute(tab, "aria-selected");
            rememberAttribute(tab, "aria-controls");

            setRole(tab, "tab");
            setAriaAttribute(tab, "aria-selected", selected);

            if (panel) {
                rememberAttribute(panel, "role");
                rememberAttribute(panel, "aria-labelledby");
                rememberAttribute(panel, "hidden");

                setRole(panel, "tabpanel");
                setAriaControls(tab, panel);
                setAriaLabelledBy(panel, tab);

                panel.hidden = !selected;
            }
        }
    }

    function setCurrentTab(
        tab: HTMLElement | null,
        setCurrentOptions: { focus?: boolean } = {}
    ): boolean {
        if (destroyed || !tab || !isTabAvailable(tab)) {
            return false;
        }

        const panel = getPanel(tab);

        if (!panel) {
            return false;
        }

        if (currentTab === tab) {
            if (setCurrentOptions.focus) {
                rovingFocus.setCurrentItem(tab, { focus: true });
            }

            return true;
        }

        currentTab = tab;
        syncState();

        if (setCurrentOptions.focus) {
            rovingFocus.setCurrentItem(tab, { focus: true });
        } else {
            rovingFocus.setCurrentItem(tab);
        }

        options.onTabChange?.(tab, panel);

        return true;
    }

    function handleClick(event: MouseEvent): void {
        const tab = getTabFromEventTarget(event.target);

        if (!tab) {
            return;
        }

        event.preventDefault();
        setCurrentTab(tab, { focus: true });
    }

    function handleFocusIn(event: FocusEvent): void {
        if (activationMode !== "automatic") {
            return;
        }

        setCurrentTab(getTabFromEventTarget(event.target));
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (activationMode !== "manual") {
            return;
        }

        if (!isEnterKey(event) && !isSpaceKey(event)) {
            return;
        }

        const tab = getTabFromEventTarget(event.target);

        if (!tab) {
            return;
        }

        event.preventDefault();
        setCurrentTab(tab);
    }

    function getRovingFocusOptions(): RovingFocusOptions {
        const rovingFocusOptions: RovingFocusOptions = {
            getItems: getTabs,
            orientation,
            currentItem: () => currentTab,
            isItemDisabled: isTabDisabled
        };

        if (options.loop !== undefined) {
            rovingFocusOptions.loop = options.loop;
        }

        return rovingFocusOptions;
    }

    currentTab = getInitialTab();
    syncState();

    rovingFocus = createRovingFocus(tablist, getRovingFocusOptions());
    rovingFocus.activate();

    const cleanups: Cleanup[] = [
        addEventListener<MouseEvent>(tablist, "click", handleClick),
        addEventListener<FocusEvent>(tablist, "focusin", handleFocusIn),
        addEventListener<KeyboardEvent>(tablist, "keydown", handleKeyDown)
    ];

    return {
        tablist,

        getCurrentTab(): HTMLElement | null {
            return currentTab;
        },

        getCurrentPanel(): HTMLElement | null {
            return currentTab ? getPanel(currentTab) : null;
        },

        setCurrentTab,

        refresh(): void {
            if (destroyed) {
                return;
            }

            if (!currentTab || !isTabAvailable(currentTab)) {
                currentTab = getInitialTab();
            }

            syncState();
            rovingFocus.refresh();
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;

            for (const cleanup of cleanups) {
                cleanup();
            }

            rovingFocus.deactivate();
            restoreAttributes();
        }
    };
}
