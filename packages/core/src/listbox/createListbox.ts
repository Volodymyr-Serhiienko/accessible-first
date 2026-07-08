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

    const originalAttributes = new Map<HTMLElement, Map<string, string | null>>();

    let selectedOptions = new Set<HTMLElement>();
    let currentOption: HTMLElement | null = null;
    let destroyed = false;
    let rovingFocus: RovingFocus;

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

    function normalizeSelectedOptions(nextOptions: HTMLElement[]): HTMLElement[] {
        const availableOptions = nextOptions.filter(isOptionAvailable);

        if (selectionMode === "single") {
            const first = availableOptions[0];

            return first ? [first] : [];
        }

        const selectedSet = new Set(availableOptions);

        return getOptions().filter((option) => selectedSet.has(option));
    }

    function getInitialSelectedOptions(): HTMLElement[] {
        if (options.defaultSelectedOptions !== undefined) {
            const list = Array.isArray(options.defaultSelectedOptions)
                ? options.defaultSelectedOptions
                : [options.defaultSelectedOptions];

            return normalizeSelectedOptions(
                list
                    .map(resolveOption)
                    .filter((option): option is HTMLElement => option !== null)
            );
        }

        return normalizeSelectedOptions(
            getOptions().filter((option) => (
                option.getAttribute("aria-selected") === "true"
            ))
        );
    }

    function getSelectedOptions(): HTMLElement[] {
        return getOptions().filter((option) => selectedOptions.has(option));
    }

    function hasSelectionChanged(nextOptions: HTMLElement[]): boolean {
        if (nextOptions.length !== selectedOptions.size) {
            return true;
        }

        return nextOptions.some((option) => !selectedOptions.has(option));
    }

    function syncState(): void {
        rememberAttribute(element, "role");
        rememberAttribute(element, "aria-orientation");
        rememberAttribute(element, "aria-multiselectable");

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
            rememberAttribute(option, "role");
            rememberAttribute(option, "aria-selected");

            setRole(option, "option");
            setAriaAttribute(option, "aria-selected", selectedOptions.has(option));
        }
    }

    function updateSelectedOptions(
        nextOptions: HTMLElement[],
        notify = true
    ): void {
        if (destroyed) {
            return;
        }

        const normalizedOptions = normalizeSelectedOptions(nextOptions);
        const changed = hasSelectionChanged(normalizedOptions);

        selectedOptions = new Set(normalizedOptions);
        syncState();

        if (changed && notify) {
            options.onSelectionChange?.(getSelectedOptions());
        }
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
            updateSelectedOptions([option]);
        }

        return true;
    }

    function selectOption(option: HTMLElement): boolean {
        if (destroyed || !isOptionAvailable(option)) {
            return false;
        }

        if (selectionMode === "single") {
            updateSelectedOptions([option]);
            return true;
        }

        updateSelectedOptions([
            ...getSelectedOptions(),
            option
        ]);

        return true;
    }

    function deselectOption(option: HTMLElement): boolean {
        if (destroyed || !selectedOptions.has(option)) {
            return false;
        }

        updateSelectedOptions(
            getSelectedOptions().filter((selectedOption) => selectedOption !== option)
        );

        return true;
    }

    function toggleOption(option: HTMLElement): boolean {
        if (selectedOptions.has(option)) {
            return deselectOption(option);
        }

        return selectOption(option);
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
        if (!isEnterKey(event) && !isSpaceKey(event)) {
            return;
        }

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

    selectedOptions = new Set(getInitialSelectedOptions());
    currentOption =
        getSelectedOptions()[0] ??
        getFirstItem(getOptions(), { isItemDisabled: isOptionDisabled });

    syncState();

    rovingFocus = createRovingFocus(element, getRovingFocusOptions());
    rovingFocus.activate();

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
            updateSelectedOptions(nextOptions);
        },

        isSelected(option: HTMLElement): boolean {
            return selectedOptions.has(option);
        },

        selectOption,

        deselectOption,

        toggleOption,

        clearSelection(): void {
            updateSelectedOptions([]);
        },

        refresh(): void {
            if (destroyed) {
                return;
            }

            updateSelectedOptions(getSelectedOptions(), false);

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

            rovingFocus.deactivate();
            restoreAttributes();
        }
    };
}
