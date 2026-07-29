import {
    setAriaAttribute,
    setAriaDisabled,
    setRole
} from "../aria";
import { getFirstItem } from "../collection";
import { addEventListener, type Cleanup } from "../events";
import { isEnterKey, isEscapeKey, isSpaceKey } from "../keyboard";
import {
    createRovingFocus,
    isRovingFocusItemDisabled,
    type RovingFocus,
    type RovingFocusOptions
} from "../roving-focus";
import {
    createTypeahead,
    type Typeahead,
    type TypeaheadOptions
} from "../typeahead";
import { restoreAttribute } from "../dom";

import type { Menu, MenuItem, MenuOptions } from "./types";

function resolveItem(item: MenuItem | undefined): HTMLElement | null {
    return typeof item === "function" ? item() : item ?? null;
}

function isNode(value: EventTarget | null): value is Node {
    return typeof value === "object" && value !== null && "nodeType" in value;
}

/**
 * Creates and initializes an accessible menu component.
 * Orchestrates a menu container (`role="menu"`) and its choices (`role="menuitem"`), managing
 * roving keyboard focus loops, optional character sequence text typeahead search tracking, 
 * choice activations, and automatic modal dismissals.
 * Cleans up and fully restores baseline DOM mutations upon destruction.
 *
 * @param element - The parent context HTMLElement configured as the menu container.
 * @param options - Custom strategies for parsing menu items, layouts, actions, and lifecycle hooks.
 * @returns A Menu component instance exposing focused items tracking and full teardown routines.
 */
export function createMenu(
    element: HTMLElement,
    options: MenuOptions
): Menu {
    const orientation = options.orientation ?? "vertical";
    const closeOnSelect = options.closeOnSelect ?? true;

    const originalAttributes = new Map<HTMLElement, Map<string, string | null>>();

    let currentItem: HTMLElement | null = null;
    let destroyed = false;
    let rovingFocus: RovingFocus;
    let typeahead: Typeahead<HTMLElement> | null = null;

    function rememberAttribute(target: HTMLElement, name: string): void {
        let attributes = originalAttributes.get(target);

        if (!attributes) {
            attributes = new Map<string, string | null>();
            originalAttributes.set(target, attributes);
        }

        if (!attributes.has(name)) {
            attributes.set(name, target.getAttribute(name));
        }
    }

    function restoreAttributes(): void {
        for (const [target, attributes] of originalAttributes) {
            for (const [name, value] of attributes) {
                restoreAttribute(target, name, value);
            }
        }

        originalAttributes.clear();
    }

    function getItems(): HTMLElement[] {
        return options.getItems();
    }

    function isItemDisabled(item: HTMLElement): boolean {
        return options.isItemDisabled?.(item) ?? isRovingFocusItemDisabled(item);
    }

    function isItemAvailable(item: HTMLElement): boolean {
        return getItems().includes(item) && !isItemDisabled(item);
    }

    function getItemFromEventTarget(target: EventTarget | null): HTMLElement | null {
        if (!isNode(target)) {
            return null;
        }

        return getItems().find((item) => (
            item === target || item.contains(target)
        )) ?? null;
    }

    function getInitialItem(): HTMLElement | null {
        const defaultItem = resolveItem(options.defaultItem);

        if (defaultItem && isItemAvailable(defaultItem)) {
            return defaultItem;
        }

        return getFirstItem(getItems(), { isItemDisabled });
    }

    function syncState(): void {
        rememberAttribute(element, "role");
        rememberAttribute(element, "aria-orientation");

        setRole(element, "menu");
        setAriaAttribute(
            element,
            "aria-orientation",
            orientation === "horizontal" ? "horizontal" : null
        );

        for (const item of getItems()) {
            rememberAttribute(item, "role");
            rememberAttribute(item, "aria-disabled");

            setRole(item, "menuitem");
            setAriaDisabled(item, isItemDisabled(item) ? true : null);
        }
    }

    function setCurrentItem(
        item: HTMLElement | null,
        setCurrentOptions: { focus?: boolean } = {}
    ): boolean {
        if (destroyed || !item || !isItemAvailable(item)) {
            return false;
        }

        currentItem = item;

        rovingFocus.setCurrentItem(item, {
            focus: setCurrentOptions.focus ?? false
        });

        return true;
    }

    function selectItem(item: HTMLElement, event: Event): void {
        if (destroyed || !isItemAvailable(item)) {
            return;
        }

        options.onSelect?.(item, event);

        if (closeOnSelect) {
            options.onClose?.();
        }
    }

    function handleClick(event: MouseEvent): void {
        const item = getItemFromEventTarget(event.target);

        if (!item) {
            return;
        }

        if (!isItemAvailable(item)) {
            event.preventDefault();
            return;
        }

        setCurrentItem(item, { focus: true });
        selectItem(item, event);
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (isEscapeKey(event)) {
            event.preventDefault();
            options.onClose?.();
            return;
        }

        if (isEnterKey(event) || isSpaceKey(event)) {
            const item = getItemFromEventTarget(event.target) ?? currentItem;

            if (!item || !isItemAvailable(item)) {
                return;
            }

            event.preventDefault();
            setCurrentItem(item);
            selectItem(item, event);
            return;
        }

        typeahead?.handleKey(event, currentItem);
    }

    function getRovingFocusOptions(): RovingFocusOptions {
        const rovingFocusOptions: RovingFocusOptions = {
            getItems,
            orientation,
            currentItem: () => currentItem,
            isItemDisabled
        };

        if (options.loop !== undefined) {
            rovingFocusOptions.loop = options.loop;
        }

        return rovingFocusOptions;
    }

    function getItemText(item: HTMLElement): string {
        return options.getItemText?.(item) ?? item.textContent ?? "";
    }

    function getTypeaheadOptions(): TypeaheadOptions<HTMLElement> {
        const typeaheadOptions: TypeaheadOptions<HTMLElement> = {
            getItems,
            getItemText,
            isItemDisabled,
            onMatch: (item) => {
                setCurrentItem(item, { focus: true });
            }
        };

        if (options.typeaheadTimeout !== undefined) {
            typeaheadOptions.timeout = options.typeaheadTimeout;
        }

        return typeaheadOptions;
    }

    currentItem = getInitialItem();
    syncState();

    rovingFocus = createRovingFocus(element, getRovingFocusOptions());
    rovingFocus.activate();

    if (options.typeahead !== false) {
        typeahead = createTypeahead(getTypeaheadOptions());
    }

    const cleanups: Cleanup[] = [
        addEventListener<MouseEvent>(element, "click", handleClick),
        addEventListener<KeyboardEvent>(element, "keydown", handleKeyDown)
    ];

    return {
        element,

        getCurrentItem(): HTMLElement | null {
            return currentItem;
        },

        setCurrentItem,

        refresh(): void {
            if (destroyed) {
                return;
            }

            if (!currentItem || !isItemAvailable(currentItem)) {
                currentItem = getInitialItem();
            }

            syncState();

            if (currentItem) {
                rovingFocus.setCurrentItem(currentItem);
            }

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

            typeahead?.destroy();
            typeahead = null;

            rovingFocus.deactivate();
            restoreAttributes();
        }
    };
}
