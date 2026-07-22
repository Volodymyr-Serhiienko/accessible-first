import { addEventListener } from "../../../core/src/events";
import { focusElement } from "../../../core/src/focus";
import { isArrowDownKey, isArrowUpKey, isEndKey, isHomeKey } from "../../../core/src/keyboard";
import { scrollIntoViewIfNeeded } from "../../../core/src/scroll";
import { createDisclosure, type DisclosureInstance as Disclosure } from "../disclosure";
import { createComponentLifecycle } from "../foundation";
import type {
    Accordion,
    AccordionItem,
    AccordionItemOptions,
    AccordionOpenChangeDetail,
    AccordionOptions,
    AccordionSize,
    AccordionVariant
} from "./types";

interface InternalAccordionItem extends AccordionItem {
    ownDisabled: boolean;
}

function restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
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
        const firstAvailableIndex = items.findIndex((item) => item.disabled !== true);
        states[firstAvailableIndex >= 0 ? firstAvailableIndex : 0] = true;
    }

    return states;
}

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
    let suppressOpenChange = false;
    let loop = options.loop ?? true;

    const internalItems: InternalAccordionItem[] = [];

    function getItemByTrigger(target: EventTarget | null): InternalAccordionItem | null {
    if (!(target instanceof HTMLElement)) {
        return null;
    }

    return internalItems.find((item) => item.trigger === target) ?? null;
}

function getAvailableItems(): InternalAccordionItem[] {
    return internalItems.filter((item) => !item.isDisabled());
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
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-accordion-multiple", String(multiple));
        element.setAttribute("data-af-accordion-collapsible", String(collapsible));
    }

    function syncItemAttributes(item: InternalAccordionItem): void {
        item.element.setAttribute("data-af-accordion-item", "");
        item.element.setAttribute("data-af-accordion-value", item.value);
        item.element.setAttribute("data-af-open", String(item.isOpen()));

        if (item.isDisabled()) {
            item.element.setAttribute("data-af-disabled", "true");
        } else {
            item.element.removeAttribute("data-af-disabled");
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

        for (const otherItem of internalItems) {
            if (otherItem !== item && otherItem.isOpen()) {
                otherItem.setOpen(false);
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
        syncItemAttributes(item);

        if (suppressOpenChange) {
            return;
        }

        if (!open && !canCloseItem(item)) {
            suppressOpenChange = true;
            item.disclosure.setOpen(true);
            suppressOpenChange = false;
            syncItemAttributes(item);
            return;
        }

        if (open) {
            closeOtherItems(item);
        }

        emitOpenChange(item);
    }

    function setItemDisabled(item: InternalAccordionItem, nextDisabled: boolean): void {
        item.ownDisabled = nextDisabled;
        item.disclosure.setDisabled(disabled || item.ownDisabled);
        syncItemAttributes(item);
    }

    function syncDisabledState(): void {
        lifecycle.setState(disabled ? "disabled" : "ready");

        for (const item of internalItems) {
            item.disclosure.setDisabled(disabled || item.ownDisabled);
            syncItemAttributes(item);
        }
    }

    function ensureRequiredOpenItem(): void {
        if (multiple || collapsible || getOpenItems().length > 0) {
            return;
        }

        const firstAvailable = internalItems.find((item) => !item.isDisabled()) ?? internalItems[0];

        if (firstAvailable) {
            firstAvailable.setOpen(true);
        }
    }

    function normalizeSingleOpenState(): void {
        if (multiple) {
            return;
        }

        let firstOpenFound = false;

        for (const item of internalItems) {
            if (item.isOpen() && !firstOpenFound) {
                firstOpenFound = true;
                continue;
            }

            if (item.isOpen()) {
                item.setOpen(false);
            }
        }

        ensureRequiredOpenItem();
    }

    syncRootAttributes();

    options.items.forEach((itemOptions, index) => {
        const value = getUniqueValue(itemOptions, index, usedValues);
        const ownDisabled = itemOptions.disabled ?? false;
        const originalItemMarker = itemOptions.element.getAttribute("data-af-accordion-item");
        const originalItemValue = itemOptions.element.getAttribute("data-af-accordion-value");
        const originalItemOpen = itemOptions.element.getAttribute("data-af-open");
        const originalItemDisabled = itemOptions.element.getAttribute("data-af-disabled");

        let item!: InternalAccordionItem;

        const disclosure: Disclosure = createDisclosure(itemOptions.element, {
            trigger: itemOptions.trigger,
            panel: itemOptions.panel,
            defaultOpen: initialOpenStates[index] ?? false,
            disabled: disabled || ownDisabled,
            variant,
            size,
            onOpenChange(open) {
                handleItemOpenChange(item, open);
            }
        });

        item = {
            value,
            element: itemOptions.element,
            trigger: itemOptions.trigger,
            panel: itemOptions.panel,
            disclosure,
            ownDisabled,

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
                if (!open && !canCloseItem(item)) {
                    return;
                }

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

    lifecycle.addCleanup(
        addEventListener<KeyboardEvent>(element, "keydown", handleKeyDown)
    );

    lifecycle.addCleanup(() => {
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "data-af-accordion-multiple", originalMultiple);
        restoreAttribute(element, "data-af-accordion-collapsible", originalCollapsible);
    });

    ensureRequiredOpenItem();

    return {
        element,
        items: internalItems,

        openItem(value): void {
            this.setItemOpen(value, true);
        },

        closeItem(value): void {
            this.setItemOpen(value, false);
        },

        toggleItem(value): void {
            const item = getInternalItem(value);

            if (item) {
                item.toggle();
            }
        },

        setItemOpen(value, open): void {
            const item = getInternalItem(value);

            if (item) {
                item.setOpen(open);
            }
        },

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
            syncDisabledState();
        },

        isDisabled(): boolean {
            return disabled;
        },

        refresh(): void {
            // All accordion triggers remain in the normal Tab sequence.
        },

        update(nextOptions): void {
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

            syncRootAttributes();
            normalizeSingleOpenState();
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
