import {
    getFirstItem,
    getLastItem,
    getNextItem,
    getPreviousItem,
    type CollectionNavigationOptions
} from "../collection";
import { addEventListener, type Cleanup } from "../events";
import { focusElement } from "../focus";
import { getOwnerWindow, isHTMLElement, restoreAttribute } from "../dom";
import {
    isArrowDownKey,
    isArrowLeftKey,
    isArrowRightKey,
    isArrowUpKey,
    isEndKey,
    isHomeKey
} from "../keyboard";
import { canFocusCollectionItem, isCollectionItemUnavailable } from "./collectionAvailability";
import type { RovingFocus, RovingFocusOptions } from "./types";
import { scrollIntoViewIfNeeded } from "../scroll";

function resolveItem(
    item: HTMLElement | (() => HTMLElement | null) | null | undefined
): HTMLElement | null {
    return typeof item === "function" ? item() : item ?? null;
}

/**
 * Creates a roving focus management instance for a collection of elements within a container.
 * Dynamically manages the `tabindex` attributes of child items to ensure accessibility compliant 
 * keyboard navigation (Home, End, and Arrow keys).
 *
 * @param container - The parent DOM element containing the items.
 * @param options - Configuration options for orientation, looping, custom filtering, and initialization.
 * @returns An object implementing the RovingFocus interface to control focus lifecycle and navigation.
 */
export function createRovingFocus(
    container: HTMLElement,
    options: RovingFocusOptions
): RovingFocus {
    const orientation = options.orientation ?? "both";
    const originalTabIndexes = new Map<HTMLElement, string | null>();

    let active = false;
    let currentItem: HTMLElement | null = null;
    let cleanups: Cleanup[] = [];

    function getItems(): HTMLElement[] {
        return options.getItems();
    }

    function isItemDisabled(item: HTMLElement): boolean {
        return isCollectionItemUnavailable(container, item, options.isItemDisabled);
    }

    function getNavigationOptions(): CollectionNavigationOptions<HTMLElement> {
        const navigationOptions: CollectionNavigationOptions<HTMLElement> = {
            isItemDisabled
        };

        if (options.loop !== undefined) {
            navigationOptions.loop = options.loop;
        }

        return navigationOptions;
    }

    function rememberTabIndex(item: HTMLElement): void {
        if (!originalTabIndexes.has(item)) {
            originalTabIndexes.set(item, item.getAttribute("tabindex"));
        }
    }

    function setItemTabIndex(item: HTMLElement, value: number): void {
        rememberTabIndex(item);
        item.tabIndex = value;
    }

    function restoreTabIndexes(): void {
        for (const [item, value] of originalTabIndexes) {
            restoreAttribute(item, "tabindex", value);
        }

        originalTabIndexes.clear();
    }

    function focusItem(item: HTMLElement | null): boolean {
        if (!item || !canFocusCollectionItem(item) || !focusElement(item)) {
            return false;
        }

        scrollIntoViewIfNeeded(item);

        return true;
    }

    function syncTabIndexes(): void {
        const items = getItems();
        const itemSet = new Set(items);
        for (const [item, value] of originalTabIndexes) {
            if (!itemSet.has(item)) {
                restoreAttribute(item, "tabindex", value);
                originalTabIndexes.delete(item);
            }
        }
        const availableCurrent =
            currentItem && items.includes(currentItem) && !isItemDisabled(currentItem)
                ? currentItem
                : getFirstItem(items, { isItemDisabled });

        currentItem = availableCurrent;

        for (const item of items) {
            setItemTabIndex(item, item === currentItem ? 0 : -1);
        }
    }

    function moveToItem(
        item: HTMLElement | null,
        focus = true
    ): boolean {
        if (!item || !getItems().includes(item) || isItemDisabled(item)) {
            return false;
        }

        if (focus && !canFocusCollectionItem(item)) {
            return false;
        }

        currentItem = item;
        syncTabIndexes();

        if (!focus) {
            return true;
        }

        return focusItem(item);
    }

    function handleFocusIn(event: FocusEvent): void {
        if (active && isHTMLElement(event.target) && getItems().includes(event.target)) {
            moveToItem(event.target, false);
        }
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (!active || event.defaultPrevented || event.isComposing
            || event.ctrlKey || event.altKey || event.metaKey
            || !isHTMLElement(event.target) || !getItems().includes(event.target)
            || isItemDisabled(event.target)) {
            return;
        }

        if (isHomeKey(event)) {
            event.preventDefault();
            moveFirst();
            return;
        }

        if (isEndKey(event)) {
            event.preventDefault();
            moveLast();
            return;
        }

        if (
            (orientation === "vertical" || orientation === "both") &&
            isArrowDownKey(event)
        ) {
            event.preventDefault();
            moveNext();
            return;
        }

        if (
            (orientation === "vertical" || orientation === "both") &&
            isArrowUpKey(event)
        ) {
            event.preventDefault();
            movePrevious();
            return;
        }

        if (
            (orientation === "horizontal" || orientation === "both") &&
            isArrowRightKey(event)
        ) {
            event.preventDefault();
            if (getOwnerWindow(container).getComputedStyle(container).direction === "rtl") movePrevious();
            else moveNext();
            return;
        }

        if (
            (orientation === "horizontal" || orientation === "both") &&
            isArrowLeftKey(event)
        ) {
            event.preventDefault();
            if (getOwnerWindow(container).getComputedStyle(container).direction === "rtl") moveNext();
            else movePrevious();
        }
    }

    function moveFirst(): boolean {
        return moveToItem(
            getFirstItem(getItems(), { isItemDisabled })
        );
    }

    function moveLast(): boolean {
        return moveToItem(
            getLastItem(getItems(), { isItemDisabled })
        );
    }

    function moveNext(): boolean {
        return moveToItem(
            getNextItem(
                getItems(),
                currentItem,
                getNavigationOptions()
            )
        );
    }

    function movePrevious(): boolean {
        return moveToItem(
            getPreviousItem(
                getItems(),
                currentItem,
                getNavigationOptions()
            )
        );
    }

    return {
        activate(): void {
            if (active) {
                return;
            }

            currentItem = resolveItem(options.currentItem);
            syncTabIndexes();

            cleanups = [
                addEventListener<KeyboardEvent>(container, "keydown", handleKeyDown),
                addEventListener<FocusEvent>(container, "focusin", handleFocusIn)
            ];

            active = true;

            if (options.focusOnActivate) {
                focusItem(currentItem);
            }
        },

        deactivate(): void {
            if (!active) {
                return;
            }

            for (const cleanup of cleanups.splice(0)) cleanup();

            active = false;
            currentItem = null;

            restoreTabIndexes();
        },

        refresh(): void {
            if (!active) {
                return;
            }

            syncTabIndexes();
        },

        moveFirst,
        moveLast,
        moveNext,
        movePrevious,

        setCurrentItem(
            item: HTMLElement | null,
            options = {}
        ): boolean {
            return moveToItem(item, options.focus ?? false);
        },

        getCurrentItem(): HTMLElement | null {
            return currentItem;
        },

        isActive(): boolean {
            return active;
        }
    };
}
