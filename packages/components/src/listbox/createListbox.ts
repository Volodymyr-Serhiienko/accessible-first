import {
    createListbox as createListboxBehavior,
    type ListboxOptions as CoreListboxOptions
} from "../../../core/src/listbox";
import { restoreAttribute } from "../../../core/src/dom";
import { createComponentLifecycle } from "../foundation";
import type { Listbox, ListboxOptions, ListboxSize, ListboxUpdateOptions, ListboxVariant } from "./types";

function getCoreListboxOptions(
    options: ListboxOptions,
    onSelectionChange: (selectedOptions: HTMLElement[]) => void
): CoreListboxOptions {
    const coreOptions: CoreListboxOptions = {
        getOptions: options.getOptions,
        onSelectionChange
    };

    if (options.orientation !== undefined) coreOptions.orientation = options.orientation;
    if (options.loop !== undefined) coreOptions.loop = options.loop;
    if (options.selectionMode !== undefined) coreOptions.selectionMode = options.selectionMode;
    if (options.selectionFollowsFocus !== undefined) coreOptions.selectionFollowsFocus = options.selectionFollowsFocus;
    if (options.typeahead !== undefined) coreOptions.typeahead = options.typeahead;
    if (options.typeaheadTimeout !== undefined) coreOptions.typeaheadTimeout = options.typeaheadTimeout;
    if (options.getOptionText !== undefined) coreOptions.getOptionText = options.getOptionText;
    if (options.isOptionDisabled !== undefined) coreOptions.isOptionDisabled = options.isOptionDisabled;

    if (options.selectedOptions !== undefined) {
        coreOptions.defaultSelectedOptions = options.selectedOptions;
    } else if (options.defaultSelectedOptions !== undefined) {
        coreOptions.defaultSelectedOptions = options.defaultSelectedOptions;
    }

    return coreOptions;
}

/**
 * Enhances an existing element with Accessible First listbox behavior.
 *
 * The component layer adds styling/debug attributes and lifecycle cleanup while
 * the core listbox module manages roles, selection, roving focus, and typeahead.
 */
export function createListbox(element: HTMLElement, options: ListboxOptions): Listbox {
    const lifecycle = createComponentLifecycle(element, { name: "listbox" });

    const originalAriaLabel = element.getAttribute("aria-label");
    const originalAriaLabelledBy = element.getAttribute("aria-labelledby");
    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalOrientation = element.getAttribute("data-af-orientation");
    const originalSelectionMode = element.getAttribute("data-af-selection-mode");

    const orientation = options.orientation ?? "vertical";
    const selectionMode = options.selectionMode ?? "single";

    let label = options.label;
    let labelledBy = options.labelledBy;
    let variant: ListboxVariant = options.variant ?? "default";
    let size: ListboxSize = options.size ?? "md";
    let onSelectionChange = options.onSelectionChange ?? null;

    const coreOptions = getCoreListboxOptions(options, (selectedOptions) => {
        onSelectionChange?.(selectedOptions);
    });

    const listbox = createListboxBehavior(element, coreOptions);

    function syncAccessibleName(): void {
        const labelledByText = labelledBy?.trim() ?? "";
        const labelText = label?.trim() ?? "";

        if (labelledByText) {
            element.setAttribute("aria-labelledby", labelledByText);
            element.removeAttribute("aria-label");
            return;
        }

        if (labelText) {
            element.setAttribute("aria-label", labelText);
            element.removeAttribute("aria-labelledby");
            return;
        }

        if (labelledBy !== undefined) {
            element.removeAttribute("aria-labelledby");
        }

        if (label !== undefined) {
            element.removeAttribute("aria-label");
        }
    }

    function syncAttributes(): void {
        syncAccessibleName();
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-orientation", orientation);
        element.setAttribute("data-af-selection-mode", selectionMode);
    }

    syncAttributes();

    lifecycle.addCleanup(() => {
        restoreAttribute(element, "aria-label", originalAriaLabel);
        restoreAttribute(element, "aria-labelledby", originalAriaLabelledBy);
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "data-af-orientation", originalOrientation);
        restoreAttribute(element, "data-af-selection-mode", originalSelectionMode);
    });

    lifecycle.addCleanup(() => listbox.destroy());

    return {
        element,
        listbox: element,

        getCurrentOption: listbox.getCurrentOption,
        setCurrentOption: listbox.setCurrentOption,
        getSelectedOptions: listbox.getSelectedOptions,
        setSelectedOptions: listbox.setSelectedOptions,
        isSelected: listbox.isSelected,
        selectOption: listbox.selectOption,
        deselectOption: listbox.deselectOption,
        toggleOption: listbox.toggleOption,
        clearSelection: listbox.clearSelection,
        refresh: listbox.refresh,

        update(nextOptions: ListboxUpdateOptions): void {
            if ("onSelectionChange" in nextOptions) {
                onSelectionChange = nextOptions.onSelectionChange ?? null;
            }

            if ("label" in nextOptions) label = nextOptions.label ?? null;
            if ("labelledBy" in nextOptions) labelledBy = nextOptions.labelledBy ?? null;
            if (nextOptions.getOptions !== undefined) coreOptions.getOptions = nextOptions.getOptions;
            if (nextOptions.getOptionText !== undefined) coreOptions.getOptionText = nextOptions.getOptionText;
            if (nextOptions.isOptionDisabled !== undefined) coreOptions.isOptionDisabled = nextOptions.isOptionDisabled;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            syncAttributes();
            listbox.refresh();

            if (nextOptions.selectedOptions !== undefined) {
                listbox.setSelectedOptions(nextOptions.selectedOptions);
            }
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
