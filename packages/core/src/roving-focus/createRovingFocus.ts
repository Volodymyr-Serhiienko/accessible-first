import {
    getFirstItem,
    getLastItem,
    getNextItem,
    getPreviousItem,
    type CollectionNavigationOptions
} from "../collection";
import { addEventListener, type Cleanup } from "../events";
import { focusElement } from "../focus";
import {
    isArrowDownKey,
    isArrowLeftKey,
    isArrowRightKey,
    isArrowUpKey,
    isEndKey,
    isHomeKey
} from "../keyboard";
import { isRovingFocusItemDisabled } from "./isRovingFocusItemDisabled";
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
    let cleanupKeyDown: Cleanup | null = null;

    function getItems(): HTMLElement[] {
        return options.getItems();
    }

    function isItemDisabled(item: HTMLElement): boolean {
        return options.isItemDisabled?.(item) ?? isRovingFocusItemDisabled(item);
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
            if (value === null) {
                item.removeAttribute("tabindex");
            } else {
                item.setAttribute("tabindex", value);
            }
        }

        originalTabIndexes.clear();
    }

    function focusItem(item: HTMLElement | null): boolean {
        if (!item || !focusElement(item)) {
            return false;
        }

        scrollIntoViewIfNeeded(item);

        return true;
    }

    function syncTabIndexes(): void {
        const items = getItems();
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
        if (!item || isItemDisabled(item)) {
            return false;
        }

        currentItem = item;
        syncTabIndexes();

        if (!focus) {
            return true;
        }

        return focusItem(item);
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (!active) {
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
            moveNext();
            return;
        }

        if (
            (orientation === "horizontal" || orientation === "both") &&
            isArrowLeftKey(event)
        ) {
            event.preventDefault();
            movePrevious();
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

            cleanupKeyDown = addEventListener<KeyboardEvent>(
                container,
                "keydown",
                handleKeyDown
            );

            active = true;

            if (options.focusOnActivate) {
                focusItem(currentItem);
            }
        },

        deactivate(): void {
            if (!active) {
                return;
            }

            cleanupKeyDown?.();
            cleanupKeyDown = null;

            active = false;
            currentItem = null;

            restoreTabIndexes();
        },

        refresh(): void {
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
