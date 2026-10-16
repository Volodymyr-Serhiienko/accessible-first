import { addEventListener, runCleanups } from "../../../core/src/events";
import { focusElement } from "../../../core/src/focus";
import { isArrowDownKey, isArrowUpKey, isEndKey, isHomeKey } from "../../../core/src/keyboard";
import { scrollIntoViewIfNeeded } from "../../../core/src/scroll";
import { createComponentLifecycle } from "../foundation";
import { isHTMLElement, restoreAttribute } from "../../../core/src/dom";
import { isCollectionItemUnavailable } from "../../../core/src/roving-focus/collectionAvailability";

import {
    createDisclosure,
    type DisclosureAnnouncement,
    type DisclosureInstance as Disclosure,
    type DisclosureOptions
} from "../disclosure";
import type {
    Accordion,
    AccordionItem,
    AccordionItemOptions,
    AccordionOpenChangeDetail,
    AccordionOptions,
    AccordionSize,
    AccordionUpdateOptions,
    AccordionVariant
} from "./types";

interface InternalAccordionItem extends AccordionItem {
    ownDisabled: boolean;
    ownAnnouncement: DisclosureAnnouncement | undefined;
}

function getUniqueValue(
    item: AccordionItemOptions,
    index: number,
    usedValues: Set<string>
): string {
    const baseValue = item.value ?? (item.element.id || `item-${index + 1}`);
    let value = baseValue;
    let suffix = 2;

    while (usedValues.has(value)) {
        value = `${baseValue}-${suffix++}`;
    }

    usedValues.add(value);
    return value;
}

function getOwnDisabled(item: AccordionItemOptions): boolean {
    return item.disabled ?? (item.trigger.matches(":disabled")
        || item.trigger.getAttribute("aria-disabled") === "true");
}

function getInitialOpenStates(
    items: AccordionItemOptions[],
    multiple: boolean,
    collapsible: boolean
): boolean[] {
    const states = items.map((item) => item.open ?? item.defaultOpen ?? false);

    if (!multiple) {
        let foundOpen = false;

        for (let index = 0; index < states.length; index++) {
            if (states[index] && !foundOpen) {
                foundOpen = true;
                continue;
            }

            states[index] = false;
        }
    }

    if (!multiple && !collapsible && !states.some(Boolean) && states.length > 0) {
        const firstAvailableIndex = items.findIndex((item) => !getOwnDisabled(item));
        states[firstAvailableIndex >= 0 ? firstAvailableIndex : 0] = true;
    }

    return states;
}

/**
 * Creates an accessible accordion component.
 *
 * Accordion items stay in the normal Tab order. Arrow keys are optional shortcuts
 * for browsers and assistive technologies that pass those keys through.
 */
export function createAccordion(
    element: HTMLElement,
    options: AccordionOptions
): Accordion {
    const lifecycle = createComponentLifecycle(element, {
        name: "accordion",
        initialState: options.disabled ? "disabled" : "ready"
    });

    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalMultiple = element.getAttribute("data-af-accordion-multiple");
    const originalCollapsible = element.getAttribute("data-af-accordion-collapsible");

    const usedValues = new Set<string>();
    const initialOpenStates = getInitialOpenStates(
        options.items,
        options.multiple ?? false,
        options.collapsible ?? true
    );

    let multiple = options.multiple ?? false;
    let collapsible = options.collapsible ?? true;
    let disabled = options.disabled ?? false;
    let variant: AccordionVariant = options.variant ?? "default";
    let size: AccordionSize = options.size ?? "md";
    let onOpenChange = options.onOpenChange ?? null;
    let announcement = options.announcement;
    let suppressOpenChange = false;
    let loop = options.loop ?? true;
    let revision = 0;

    const internalItems: InternalAccordionItem[] = [];

    function getItemByTrigger(target: EventTarget | null): InternalAccordionItem | null {
        if (!isHTMLElement(target)) {
            return null;
        }

        return internalItems.find((item) => item.trigger === target) ?? null;
    }

    function getAvailableItems(): InternalAccordionItem[] {
        return internalItems.filter((item) => !item.disclosure.isDestroyed()
            && !isCollectionItemUnavailable(element, item.trigger, () => item.isDisabled()));
    }

    function focusItem(item: InternalAccordionItem | null): boolean {
        if (!item || !focusElement(item.trigger)) {
            return false;
        }

        scrollIntoViewIfNeeded(item.trigger);
        return true;
    }

    function getRelativeItem(
        currentItem: InternalAccordionItem,
        direction: 1 | -1
    ): InternalAccordionItem | null {
        const items = getAvailableItems();
        const currentIndex = items.indexOf(currentItem);

        if (items.length === 0 || currentIndex === -1) {
            return null;
        }

        const nextIndex = currentIndex + direction;

        if (nextIndex < 0) {
            return loop ? items[items.length - 1] ?? null : null;
        }

        if (nextIndex >= items.length) {
            return loop ? items[0] ?? null : null;
        }

        return items[nextIndex] ?? null;
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (lifecycle.isDestroyed() || event.defaultPrevented || event.isComposing || event.keyCode === 229
            || event.altKey || event.ctrlKey || event.metaKey) return;
        const item = getItemByTrigger(event.target);

        if (!item || item.isDisabled()) {
            return;
        }

        if (isArrowDownKey(event)) {
            event.preventDefault();
            focusItem(getRelativeItem(item, 1));
            return;
        }

        if (isArrowUpKey(event)) {
            event.preventDefault();
            focusItem(getRelativeItem(item, -1));
            return;
        }

        if (isHomeKey(event)) {
            event.preventDefault();
            focusItem(getAvailableItems()[0] ?? null);
            return;
        }

        if (isEndKey(event)) {
            event.preventDefault();
            const items = getAvailableItems();
            focusItem(items[items.length - 1] ?? null);
        }
    }

    function syncRootAttributes(): void {
        if (lifecycle.isDestroyed()) return;
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-accordion-multiple", String(multiple));
        element.setAttribute("data-af-accordion-collapsible", String(collapsible));
    }

    function syncItemAttributes(item: InternalAccordionItem): void {
        if (lifecycle.isDestroyed() || item.disclosure.isDestroyed()) return;
        item.element.setAttribute("data-af-accordion-item", "");
        item.element.setAttribute("data-af-accordion-value", item.value);
        item.element.setAttribute("data-af-open", String(item.isOpen()));

        if (item.isDisabled()) {
            item.element.setAttribute("data-af-disabled", "true");
        } else {
            item.element.removeAttribute("data-af-disabled");
            if (item.isOpen() && !canCloseItem(item)) item.trigger.setAttribute("aria-disabled", "true");
            else item.trigger.removeAttribute("aria-disabled");
        }
    }

    function syncItems(): void {
        if (!lifecycle.isDestroyed()) internalItems.forEach(syncItemAttributes);
    }

    function guardRequiredOpenClick(event: MouseEvent): void {
        if (lifecycle.isDestroyed() || event.defaultPrevented) return;
        const item = internalItems.find(item => event.composedPath().includes(item.trigger));
        if (item?.isOpen() && !canCloseItem(item)) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    function getOpenItems(): InternalAccordionItem[] {
        return internalItems.filter((item) => item.isOpen());
    }

    function getInternalItem(value: string): InternalAccordionItem | null {
        return internalItems.find((item) => item.value === value) ?? null;
    }

    function canCloseItem(item: InternalAccordionItem): boolean {
        if (multiple || collapsible) {
            return true;
        }

        return getOpenItems().some((openItem) => openItem !== item);
    }

    function closeOtherItems(item: InternalAccordionItem): void {
        if (multiple) {
            return;
        }

        const current = revision;
        for (const otherItem of internalItems) {
            if (lifecycle.isDestroyed() || current !== revision || !item.isOpen()) return;
            if (otherItem !== item && otherItem.isOpen()) {
                otherItem.disclosure.setOpen(false);
            }
        }
    }

    function emitOpenChange(item: InternalAccordionItem): void {
        const detail: AccordionOpenChangeDetail = {
            value: item.value,
            open: item.isOpen(),
            item
        };

        onOpenChange?.(detail);
    }

    function handleItemOpenChange(item: InternalAccordionItem, open: boolean): void {
        if (lifecycle.isDestroyed()) return;
        const current = revision;
        syncItems();

        if (suppressOpenChange) {
            return;
        }

        if (!open && !canCloseItem(item)) {
            suppressOpenChange = true;
            try { item.disclosure.setOpen(true); }
            finally { suppressOpenChange = false; }
            syncItems();
            return;
        }

        if (open) {
            closeOtherItems(item);
        }
        if (!lifecycle.isDestroyed() && current === revision && item.isOpen() === open) {
            syncItems();
            emitOpenChange(item);
        }
    }

    function setItemDisabled(item: InternalAccordionItem, nextDisabled: boolean): void {
        if (lifecycle.isDestroyed() || item.disclosure.isDestroyed()) return;
        revision += 1;
        item.ownDisabled = nextDisabled;
        item.disclosure.setDisabled(disabled || item.ownDisabled);
        syncItems();
    }

    function syncDisabledState(): void {
        if (lifecycle.isDestroyed()) return;
        lifecycle.setState(disabled ? "disabled" : "ready");

        for (const item of internalItems) {
            item.disclosure.setDisabled(disabled || item.ownDisabled);
            syncItemAttributes(item);
        }
    }

    function ensureRequiredOpenItem(): void {
        if (lifecycle.isDestroyed() || multiple || collapsible || getOpenItems().length > 0) {
            return;
        }

        const firstAvailable = internalItems.find((item) => !item.isDisabled()) ?? internalItems[0];

        if (firstAvailable) {
            firstAvailable.disclosure.setOpen(true);
        }
    }

    function normalizeSingleOpenState(): void {
        if (multiple) {
            return;
        }

        const current = revision;
        let firstOpenFound = false;

        for (const item of internalItems) {
            if (lifecycle.isDestroyed() || current !== revision) return;
            if (item.isOpen() && !firstOpenFound) {
                firstOpenFound = true;
                continue;
            }

            if (item.isOpen()) {
                item.disclosure.setOpen(false);
            }
        }

        ensureRequiredOpenItem();
    }

    syncRootAttributes();

    lifecycle.addCleanup(() => {
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "data-af-accordion-multiple", originalMultiple);
        restoreAttribute(element, "data-af-accordion-collapsible", originalCollapsible);
    });

    try {
        options.items.forEach((itemOptions, index) => {
            const value = getUniqueValue(itemOptions, index, usedValues);
            const ownDisabled = getOwnDisabled(itemOptions);
            const originalItemMarker = itemOptions.element.getAttribute("data-af-accordion-item");
            const originalItemValue = itemOptions.element.getAttribute("data-af-accordion-value");
            const originalItemOpen = itemOptions.element.getAttribute("data-af-open");
            const originalItemDisabled = itemOptions.element.getAttribute("data-af-disabled");

            let item!: InternalAccordionItem;

            const ownAnnouncement = itemOptions.announcement;
            const itemAnnouncement = ownAnnouncement ?? announcement;

            const disclosureOptions: DisclosureOptions = {
                trigger: itemOptions.trigger,
                panel: itemOptions.panel,
                defaultOpen: initialOpenStates[index] ?? false,
                disabled: disabled || ownDisabled,
                variant,
                size,
                onOpenChange(open) {
                    handleItemOpenChange(item, open);
                }
            };

            if (itemAnnouncement !== undefined) {
                disclosureOptions.announcement = itemAnnouncement;
            }

            const disclosure: Disclosure = createDisclosure(itemOptions.element, disclosureOptions);

            item = {
                value,
                element: itemOptions.element,
                trigger: itemOptions.trigger,
                panel: itemOptions.panel,
                disclosure,
                ownDisabled,
                ownAnnouncement,

                open(): void {
                    item.setOpen(true);
                },

                close(): void {
                    item.setOpen(false);
                },

                toggle(): void {
                    item.setOpen(!item.isOpen());
                },

                setOpen(open): void {
                    if (lifecycle.isDestroyed() || disclosure.isDestroyed()) return;
                    if (!open && !canCloseItem(item)) {
                        return;
                    }

                    revision += 1;
                    disclosure.setOpen(open);
                },

                isOpen(): boolean {
                    return disclosure.isOpen();
                },

                setDisabled(nextDisabled): void {
                    setItemDisabled(item, nextDisabled);
                },

                isDisabled(): boolean {
                    return disclosure.isDisabled();
                }
            };

            internalItems.push(item);
            syncItemAttributes(item);

            lifecycle.addCleanup(() => {
                restoreAttribute(itemOptions.element, "data-af-accordion-item", originalItemMarker);
                restoreAttribute(itemOptions.element, "data-af-accordion-value", originalItemValue);
                restoreAttribute(itemOptions.element, "data-af-open", originalItemOpen);
                restoreAttribute(itemOptions.element, "data-af-disabled", originalItemDisabled);
            });

            lifecycle.addCleanup(() => {
                disclosure.destroy();
            });
        });
    } catch (error) { runCleanups([() => { throw error; }, lifecycle.destroy]); }

    lifecycle.addCleanup(
        addEventListener<KeyboardEvent>(element, "keydown", handleKeyDown)
    );
    lifecycle.addCleanup(addEventListener<MouseEvent>(element, "click", guardRequiredOpenClick, { capture: true }));

    ensureRequiredOpenItem();
    syncItems();

    function setItemOpen(value: string, open: boolean): void {
        if (!lifecycle.isDestroyed()) getInternalItem(value)?.setOpen(open);
    }

    return {
        element,
        items: internalItems,

        openItem(value): void {
            setItemOpen(value, true);
        },

        closeItem(value): void {
            setItemOpen(value, false);
        },

        toggleItem(value): void {
            const item = getInternalItem(value);

            if (item) {
                item.toggle();
            }
        },

        setItemOpen,

        getItem(value): AccordionItem | null {
            return getInternalItem(value);
        },

        getOpenValues(): string[] {
            return getOpenItems().map((item) => item.value);
        },

        setDisabled(nextDisabled): void {
            if (lifecycle.isDestroyed()) {
                return;
            }

            disabled = nextDisabled;
            revision += 1;
            syncDisabledState();
        },

        isDisabled(): boolean {
            return disabled;
        },

        refresh(): void {
            // All accordion triggers remain in the normal Tab sequence.
        },

        update(nextOptions: AccordionUpdateOptions): void {
            if (lifecycle.isDestroyed()) return;
            revision += 1;
            if (nextOptions.multiple !== undefined) {
                multiple = nextOptions.multiple;
            }

            if (nextOptions.collapsible !== undefined) {
                collapsible = nextOptions.collapsible;
            }

            if (nextOptions.loop !== undefined) {
                loop = nextOptions.loop;
            }

            if (nextOptions.variant !== undefined) {
                variant = nextOptions.variant;

                for (const item of internalItems) {
                    item.disclosure.update({ variant });
                }
            }

            if (nextOptions.size !== undefined) {
                size = nextOptions.size;

                for (const item of internalItems) {
                    item.disclosure.update({ size });
                }
            }

            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if (nextOptions.disabled !== undefined) {
                disabled = nextOptions.disabled;
                syncDisabledState();
            }

            if (nextOptions.announcement !== undefined) {
                announcement = nextOptions.announcement;

                for (const item of internalItems) {
                    if (item.ownAnnouncement === undefined) {
                        item.disclosure.update({ announcement });
                    }
                }
            }

            syncRootAttributes();
            normalizeSingleOpenState();
            syncItems();
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
