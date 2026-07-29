import {
    setAriaAttribute,
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
import {
    createSelection,
    type Selection,
    type SelectionOptions
} from "../selection";
import {
    createTypeahead,
    type Typeahead,
    type TypeaheadOptions
} from "../typeahead";
import { createAttributeSnapshot } from "../dom";

import type {
    Listbox,
    ListboxOption,
    ListboxOptions
} from "./types";

function resolveOption(option: ListboxOption | undefined): HTMLElement | null {
    return typeof option === "function" ? option() : option ?? null;
}

function isNode(value: EventTarget | null): value is Node {
    return typeof value === "object" && value !== null && "nodeType" in value;
}

/**
 * Creates and manages an accessible listbox component.
 * Orchestrates a listbox container element (`role="listbox"`) and its child options (`role="option"`), 
 * handling either single or multiple selection layouts, roving keyboard focus loops, and state changes. 
 * Cleans up and fully restores baseline DOM mutations upon destruction.
 *
 * @param element - The parent wrapper HTMLElement to be configured as the listbox component.
 * @param options - Custom strategies for list element extraction, orientations, selection behaviors, and notification hooks.
 * @returns A Listbox component instance exposing collection controls, single item mutation, and lifecycle teardowns.
 */
export function createListbox(
    element: HTMLElement,
    options: ListboxOptions
): Listbox {
    const orientation = options.orientation ?? "vertical";
    const selectionMode = options.selectionMode ?? "single";
    const selectionFollowsFocus =
        options.selectionFollowsFocus ?? selectionMode === "single";

    const attributes = createAttributeSnapshot();

    let currentOption: HTMLElement | null = null;
    let destroyed = false;
    let rovingFocus: RovingFocus;
    let selection: Selection<HTMLElement>;
    let typeahead: Typeahead<HTMLElement> | null = null;

    function getOptions(): HTMLElement[] {
        return options.getOptions();
    }

    function isOptionDisabled(option: HTMLElement): boolean {
        return options.isOptionDisabled?.(option) ?? isRovingFocusItemDisabled(option);
    }

    function isOptionAvailable(option: HTMLElement): boolean {
        return getOptions().includes(option) && !isOptionDisabled(option);
    }

    function getOptionFromEventTarget(target: EventTarget | null): HTMLElement | null {
        if (!isNode(target)) {
            return null;
        }

        return getOptions().find((option) => (
            option === target || option.contains(target)
        )) ?? null;
    }

    function getInitialSelectedOptions(): HTMLElement[] {
        if (options.defaultSelectedOptions !== undefined) {
            const list = Array.isArray(options.defaultSelectedOptions)
                ? options.defaultSelectedOptions
                : [options.defaultSelectedOptions];

            return list
                .map(resolveOption)
                .filter((option): option is HTMLElement => option !== null);
        }

        return getOptions().filter((option) => (
            option.getAttribute("aria-selected") === "true"
        ));
    }

    function getSelectedOptions(): HTMLElement[] {
        return selection.getSelectedItems();
    }

    function syncState(): void {
        attributes.remember(element, "role");
        attributes.remember(element, "aria-orientation");
        attributes.remember(element, "aria-multiselectable");

        setRole(element, "listbox");
        setAriaAttribute(
            element,
            "aria-orientation",
            orientation === "horizontal" ? "horizontal" : null
        );
        setAriaAttribute(
            element,
            "aria-multiselectable",
            selectionMode === "multiple" ? true : null
        );

        for (const option of getOptions()) {
            attributes.remember(option, "role");
            attributes.remember(option, "aria-selected");

            setRole(option, "option");
            setAriaAttribute(option, "aria-selected", selection.isSelected(option));
        }
    }

    function getSelectionOptions(): SelectionOptions<HTMLElement> {
        return {
            getItems: getOptions,
            mode: selectionMode,
            defaultSelectedItems: getInitialSelectedOptions(),
            isItemDisabled: isOptionDisabled,
            onSelectionChange: (selectedOptions) => {
                syncState();
                options.onSelectionChange?.(selectedOptions);
            }
        };
    }

    function moveToOption(
        option: HTMLElement | null,
        moveOptions: { focus?: boolean; select?: boolean } = {}
    ): boolean {
        if (destroyed || !option || !isOptionAvailable(option)) {
            return false;
        }

        currentOption = option;

        rovingFocus.setCurrentItem(option, {
            focus: moveOptions.focus ?? false
        });

        if (moveOptions.select ?? selectionFollowsFocus) {
            selection.setSelectedItems([option]);
        }

        return true;
    }

    function selectOption(option: HTMLElement): boolean {
        if (destroyed) {
            return false;
        }

        return selection.selectItem(option);
    }

    function deselectOption(option: HTMLElement): boolean {
        if (destroyed) {
            return false;
        }

        return selection.deselectItem(option);
    }

    function toggleOption(option: HTMLElement): boolean {
        if (destroyed) {
            return false;
        }

        return selection.toggleItem(option);
    }

    function handleClick(event: MouseEvent): void {
        const option = getOptionFromEventTarget(event.target);

        if (!option || !isOptionAvailable(option)) {
            return;
        }

        event.preventDefault();
        moveToOption(option, { focus: true, select: false });

        if (selectionMode === "multiple") {
            toggleOption(option);
            return;
        }

        selectOption(option);
    }

    function handleFocusIn(event: FocusEvent): void {
        moveToOption(getOptionFromEventTarget(event.target));
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (isEnterKey(event) || isSpaceKey(event)) {
            const option = getOptionFromEventTarget(event.target) ?? currentOption;

            if (!option || !isOptionAvailable(option)) {
                return;
            }

            event.preventDefault();
            moveToOption(option, { select: false });

            if (selectionMode === "multiple") {
                toggleOption(option);
                return;
            }

            selectOption(option);
            return;
        }

        typeahead?.handleKey(event, currentOption);
    }

    function getRovingFocusOptions(): RovingFocusOptions {
        const rovingFocusOptions: RovingFocusOptions = {
            getItems: getOptions,
            orientation,
            currentItem: () => currentOption,
            isItemDisabled: isOptionDisabled
        };

        if (options.loop !== undefined) {
            rovingFocusOptions.loop = options.loop;
        }

        return rovingFocusOptions;
    }

    function getOptionText(option: HTMLElement): string {
        return options.getOptionText?.(option) ?? option.textContent ?? "";
    }

    function getTypeaheadOptions(): TypeaheadOptions<HTMLElement> {
        const typeaheadOptions: TypeaheadOptions<HTMLElement> = {
            getItems: getOptions,
            getItemText: getOptionText,
            isItemDisabled: isOptionDisabled,
            onMatch: (option) => {
                moveToOption(option, { focus: true });
            }
        };

        if (options.typeaheadTimeout !== undefined) {
            typeaheadOptions.timeout = options.typeaheadTimeout;
        }

        return typeaheadOptions;
    }

    selection = createSelection(getSelectionOptions());

    currentOption =
        getSelectedOptions()[0] ??
        getFirstItem(getOptions(), { isItemDisabled: isOptionDisabled });

    syncState();

    rovingFocus = createRovingFocus(element, getRovingFocusOptions());
    rovingFocus.activate();

    if (options.typeahead !== false) {
        typeahead = createTypeahead(getTypeaheadOptions());
    }

    const cleanups: Cleanup[] = [
        addEventListener<MouseEvent>(element, "click", handleClick),
        addEventListener<FocusEvent>(element, "focusin", handleFocusIn),
        addEventListener<KeyboardEvent>(element, "keydown", handleKeyDown)
    ];

    return {
        element,

        getCurrentOption(): HTMLElement | null {
            return currentOption;
        },

        setCurrentOption(
            option: HTMLElement | null,
            setCurrentOptions: { focus?: boolean } = {}
        ): boolean {
            return moveToOption(option, setCurrentOptions);
        },

        getSelectedOptions,

        setSelectedOptions(nextOptions: HTMLElement[]): void {
            selection.setSelectedItems(nextOptions);
        },

        isSelected(option: HTMLElement): boolean {
            return selection.isSelected(option);
        },

        selectOption,

        deselectOption,

        toggleOption,

        clearSelection(): void {
            selection.clearSelection();
        },

        refresh(): void {
            if (destroyed) {
                return;
            }

            selection.refresh({ notify: false });

            if (!currentOption || !isOptionAvailable(currentOption)) {
                currentOption =
                    getSelectedOptions()[0] ??
                    getFirstItem(getOptions(), { isItemDisabled: isOptionDisabled });
            }

            syncState();

            if (currentOption) {
                rovingFocus.setCurrentItem(currentOption);
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
            attributes.restore();
        }
    };
}
