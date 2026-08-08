import {
    setAriaAttribute,
    setRole
} from "../aria";
import {
    getFirstItem,
    getLastItem,
    getNextItem,
    getPreviousItem
} from "../collection";
import {
    createAttributeSnapshot,
    getOwnerDocument
} from "../dom";
import { addEventListener, type Cleanup } from "../events";
import { createId } from "../id";
import {
    isArrowDownKey,
    isArrowUpKey,
    isEnterKey,
    isEscapeKey
} from "../keyboard";
import {
    createPopoverPosition,
    type PopoverPosition,
    type PopoverPositionOptions,
    type PopoverPositionState
} from "../popover-position";
import { scrollIntoViewIfNeeded } from "../scroll";
import type {
    Combobox,
    ComboboxActiveOptionChangeReason,
    ComboboxFilterContext,
    ComboboxOpenChangeReason,
    ComboboxOption,
    ComboboxOptions,
    ComboboxUpdateOptions,
    ComboboxValueChangeReason
} from "./types";

function resolveOption(option: ComboboxOption | undefined): HTMLElement | null {
    return typeof option === "function" ? option() : option ?? null;
}

function isNode(value: EventTarget | null): value is Node {
    return typeof value === "object" && value !== null && "nodeType" in value;
}

function normalizeText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function defaultFilter(context: ComboboxFilterContext): boolean {
    const query = normalizeText(context.inputValue).toLowerCase();

    if (!query) {
        return true;
    }

    return normalizeText(context.optionText).toLowerCase().includes(query);
}

function getPositionOptions(options: ComboboxOptions): PopoverPositionOptions {
    return {
        side: options.side ?? "bottom",
        alignment: options.alignment ?? "start",
        strategy: options.strategy ?? "fixed",
        offset: options.offset ?? 4,
        crossAxisOffset: options.crossAxisOffset ?? 0,
        collisionPadding: options.collisionPadding ?? 8,
        flip: options.flip ?? true,
        shift: options.shift ?? true,
        matchAnchorWidth: options.matchAnchorWidth ?? true,
        autoUpdate: options.autoUpdate ?? true
    };
}

/**
 * Creates accessible editable combobox behavior with a listbox popup.
 *
 * DOM focus remains on the input. The active popup option is exposed through
 * aria-activedescendant, matching the WAI-ARIA combobox pattern.
 */
export function createCombobox(
    input: HTMLInputElement,
    listbox: HTMLElement,
    options: ComboboxOptions
): Combobox {
    const attributes = createAttributeSnapshot();

    const originalValue = input.value;
    const originalDisabled = input.disabled;

    let destroyed = false;
    let disabled = options.disabled ?? input.disabled;
    let open = options.open ?? options.defaultOpen ?? false;
    let autocomplete = options.autocomplete ?? "list";
    let openOnFocus = options.openOnFocus ?? false;
    let openOnInput = options.openOnInput ?? true;
    let closeOnBlur = options.closeOnBlur ?? true;
    let closeOnEmpty = options.closeOnEmpty ?? true;
    let loop = options.loop ?? true;

    let getOptions = options.getOptions;
    let getOptionText = options.getOptionText;
    let isOptionDisabled = options.isOptionDisabled;
    let filterOption = options.filterOption;
    let onOpenChange = options.onOpenChange ?? null;
    let onValueChange = options.onValueChange ?? null;
    let onActiveOptionChange = options.onActiveOptionChange ?? null;

    let activeOption: HTMLElement | null = null;
    let selectedOption =
        resolveOption(options.selectedOption)
        ?? resolveOption(options.defaultSelectedOption);

    let filteredOptions = new Set<HTMLElement>();
    let positionOptions = getPositionOptions(options);
    let position: PopoverPosition | null = null;
    let pointerDownInsideListbox = false;
    let combobox!: Combobox;

    if (options.inputValue !== undefined) {
        input.value = options.inputValue;
    } else if (options.defaultInputValue !== undefined) {
        input.value = options.defaultInputValue;
    } else if (selectedOption) {
        input.value = getOptionTextValue(selectedOption);
    }

    function getOptionTextValue(option: HTMLElement): string {
        return normalizeText(getOptionText?.(option) ?? option.textContent ?? "");
    }

    function getOptionFromEventTarget(target: EventTarget | null): HTMLElement | null {
        if (!isNode(target)) {
            return null;
        }

        return getOptions().find((option) => option === target || option.contains(target)) ?? null;
    }

    function isDisabledOption(option: HTMLElement): boolean {
        return isOptionDisabled?.(option) ?? option.getAttribute("aria-disabled") === "true";
    }

    function optionMatchesFilter(option: HTMLElement): boolean {
        if (autocomplete === "none" || filterOption === null) {
            return true;
        }

        const context: ComboboxFilterContext = {
            inputValue: input.value,
            option,
            optionText: getOptionTextValue(option)
        };

        return filterOption?.(context) ?? defaultFilter(context);
    }

    function applyFilter(): void {
        filteredOptions = new Set(
            getOptions().filter((option) => optionMatchesFilter(option))
        );
    }

    function getVisibleOptions(): HTMLElement[] {
        return getOptions().filter((option) => filteredOptions.has(option));
    }

    function getAvailableOptions(): HTMLElement[] {
        return getVisibleOptions().filter((option) => !isDisabledOption(option));
    }

    function isAvailableOption(option: HTMLElement): boolean {
        return getAvailableOptions().includes(option);
    }

    function ensureId(element: HTMLElement, prefix: string): string {
        attributes.remember(element, "id");

        if (!element.id) {
            element.id = createId(prefix);
        }

        return element.id;
    }

    function destroyPosition(): void {
        position?.destroy();
        position = null;
    }

    function updatePosition(): PopoverPositionState | null {
        if (!open) {
            return position?.getState() ?? null;
        }

        listbox.hidden = false;
        position ??= createPopoverPosition(input, listbox, positionOptions);

        return position.update();
    }

    function syncOptionAttributes(): void {
        for (const option of getOptions()) {
            attributes.remember(option, "id");
            attributes.remember(option, "role");
            attributes.remember(option, "aria-selected");
            attributes.remember(option, "aria-disabled");
            attributes.remember(option, "hidden");

            ensureId(option, "af-combobox-option");
            setRole(option, "option");
            setAriaAttribute(option, "aria-selected", open && option === activeOption);
            setAriaAttribute(option, "aria-disabled", isDisabledOption(option) ? true : null);

            option.hidden = !filteredOptions.has(option);
        }
    }

    function syncAttributes(): void {
        attributes.remember(input, "role");
        attributes.remember(input, "aria-autocomplete");
        attributes.remember(input, "aria-expanded");
        attributes.remember(input, "aria-controls");
        attributes.remember(input, "aria-activedescendant");
        attributes.remember(input, "aria-haspopup");
        attributes.remember(listbox, "id");
        attributes.remember(listbox, "role");
        attributes.remember(listbox, "hidden");

        input.disabled = disabled;

        ensureId(listbox, "af-combobox-listbox");
        setRole(input, "combobox");
        setRole(listbox, "listbox");
        setAriaAttribute(input, "aria-autocomplete", autocomplete);
        setAriaAttribute(input, "aria-expanded", open);
        setAriaAttribute(input, "aria-controls", listbox.id);
        setAriaAttribute(input, "aria-haspopup", "listbox");
        setAriaAttribute(
            input,
            "aria-activedescendant",
            open && activeOption ? ensureId(activeOption, "af-combobox-option") : null
        );

        listbox.hidden = !open;
        syncOptionAttributes();
    }

    function notifyOpenChange(reason: ComboboxOpenChangeReason): void {
        onOpenChange?.(
            {
                open,
                reason,
                input,
                listbox
            },
            combobox
        );
    }

    function notifyValueChange(
        reason: ComboboxValueChangeReason,
        event: Event | null
    ): void {
        onValueChange?.(
            {
                inputValue: input.value,
                selectedOption,
                reason,
                event
            },
            combobox
        );
    }

    function notifyActiveOptionChange(reason: ComboboxActiveOptionChangeReason): void {
        onActiveOptionChange?.(
            {
                activeOption,
                inputValue: input.value,
                reason
            },
            combobox
        );
    }

    function setOpenState(
        nextOpen: boolean,
        reason: ComboboxOpenChangeReason
    ): void {
        if (destroyed) {
            return;
        }

        applyFilter();

        const resolvedOpen =
            !disabled
            && nextOpen
            && (!closeOnEmpty || getVisibleOptions().length > 0);

        if (open === resolvedOpen) {
            syncAttributes();

            if (open) {
                updatePosition();
            }

            return;
        }

        open = resolvedOpen;

        if (!open) {
            activeOption = null;
            destroyPosition();
        }

        syncAttributes();

        if (open) {
            updatePosition();
        }

        notifyOpenChange(reason);
    }

    function setActiveOption(
        option: ComboboxOption,
        setOptions: { scroll?: boolean } = {},
        reason: ComboboxActiveOptionChangeReason = "programmatic"
    ): boolean {
        if (destroyed) {
            return false;
        }

        const nextOption = resolveOption(option);

        if (nextOption !== null && !isAvailableOption(nextOption)) {
            return false;
        }

        activeOption = nextOption;
        syncAttributes();

        if (activeOption && (setOptions.scroll ?? false)) {
            scrollIntoViewIfNeeded(activeOption);
        }

        notifyActiveOptionChange(reason);
        return true;
    }

    function moveActiveOption(direction: 1 | -1): boolean {
        const items = getAvailableOptions();
        const nextOption = direction > 0
            ? getNextItem(items, activeOption, { loop })
            : getPreviousItem(items, activeOption, { loop });

        return setActiveOption(nextOption, { scroll: true }, "keyboard");
    }

    function openWithOption(
        option: HTMLElement | null,
        reason: ComboboxOpenChangeReason
    ): void {
        setOpenState(true, reason);

        if (open) {
            setActiveOption(option, { scroll: true }, reason === "pointer" ? "pointer" : "keyboard");
        }
    }

    function commitOption(option: HTMLElement, event: Event | null): boolean {
        if (!isAvailableOption(option)) {
            return false;
        }

        selectedOption = option;
        input.value = getOptionTextValue(option);
        activeOption = option;

        setOpenState(false, "selection");
        syncAttributes();
        notifyValueChange("selection", event);

        return true;
    }

    function handleInput(event: Event): void {
        selectedOption = null;
        activeOption = null;
        applyFilter();

        const visibleOptions = getVisibleOptions();

        if (openOnInput && (visibleOptions.length > 0 || !closeOnEmpty)) {
            setOpenState(true, "input");
        } else if (closeOnEmpty && visibleOptions.length === 0) {
            setOpenState(false, "input");
        } else {
            syncAttributes();

            if (open) {
                updatePosition();
            }
        }

        notifyValueChange("input", event);
    }

    function handleFocus(): void {
        if (!openOnFocus) {
            return;
        }

        setOpenState(true, "programmatic");
    }

    function handleBlur(): void {
        if (!closeOnBlur) {
            return;
        }

        window.requestAnimationFrame(() => {
            if (pointerDownInsideListbox) {
                return;
            }

            setOpenState(false, "blur");
        });
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (disabled) {
            return;
        }

        if (event.altKey && isArrowDownKey(event)) {
            event.preventDefault();
            setOpenState(true, "keyboard");
            return;
        }

        if (event.altKey && isArrowUpKey(event)) {
            event.preventDefault();
            setOpenState(false, "keyboard");
            return;
        }

        if (isArrowDownKey(event)) {
            event.preventDefault();

            if (!open) {
                openWithOption(
                    selectedOption && isAvailableOption(selectedOption)
                        ? selectedOption
                        : getFirstItem(getAvailableOptions()),
                    "keyboard"
                );
                return;
            }

            moveActiveOption(1);
            return;
        }

        if (isArrowUpKey(event)) {
            event.preventDefault();

            if (!open) {
                openWithOption(getLastItem(getAvailableOptions()), "keyboard");
                return;
            }

            moveActiveOption(-1);
            return;
        }

        if (isEnterKey(event) && open && activeOption) {
            event.preventDefault();
            commitOption(activeOption, event);
            return;
        }

        if (isEscapeKey(event) && open) {
            event.preventDefault();
            setOpenState(false, "keyboard");
        }
    }

    function handleListboxPointerDown(event: PointerEvent): void {
        pointerDownInsideListbox = true;

        if (getOptionFromEventTarget(event.target)) {
            event.preventDefault();
        }

        window.setTimeout(() => {
            pointerDownInsideListbox = false;
        }, 0);
    }

    function handleListboxClick(event: MouseEvent): void {
        const option = getOptionFromEventTarget(event.target);

        if (!option) {
            return;
        }

        event.preventDefault();
        commitOption(option, event);
        input.focus();
    }

    function handleDocumentPointerDown(event: PointerEvent): void {
        if (!open || !isNode(event.target)) {
            return;
        }

        if (input.contains(event.target) || listbox.contains(event.target)) {
            return;
        }

        setOpenState(false, "outside");
    }

    function refresh(): void {
        if (destroyed) {
            return;
        }

        applyFilter();

        if (activeOption && !isAvailableOption(activeOption)) {
            activeOption = null;
        }

        if (selectedOption && !getOptions().includes(selectedOption)) {
            selectedOption = null;
        }

        if (open && closeOnEmpty && getVisibleOptions().length === 0) {
            setOpenState(false, "programmatic");
            return;
        }

        syncAttributes();

        if (open) {
            updatePosition();
        }
    }

    applyFilter();
    syncAttributes();

    const cleanups: Cleanup[] = [
        addEventListener<InputEvent>(input, "input", handleInput),
        addEventListener<FocusEvent>(input, "focus", handleFocus),
        addEventListener<FocusEvent>(input, "blur", handleBlur),
        addEventListener<KeyboardEvent>(input, "keydown", handleKeyDown),
        addEventListener<PointerEvent>(listbox, "pointerdown", handleListboxPointerDown),
        addEventListener<MouseEvent>(listbox, "click", handleListboxClick),
        addEventListener<PointerEvent>(
            getOwnerDocument(input),
            "pointerdown",
            handleDocumentPointerDown,
            true
        )
    ];

    combobox = {
        input,
        listbox,

        open(): void {
            openWithOption(
                selectedOption && isAvailableOption(selectedOption)
                    ? selectedOption
                    : getFirstItem(getAvailableOptions()),
                "programmatic"
            );
        },

        close(): void {
            setOpenState(false, "programmatic");
        },

        toggle(): void {
            if (open) {
                this.close();
            } else {
                this.open();
            }
        },

        isOpen(): boolean {
            return open;
        },

        getInputValue(): string {
            return input.value;
        },

        setInputValue(value): void {
            if (destroyed) {
                return;
            }

            input.value = value;
            selectedOption = null;
            activeOption = null;
            refresh();
            notifyValueChange("programmatic", null);
        },

        getVisibleOptions,

        getActiveOption(): HTMLElement | null {
            return activeOption;
        },

        setActiveOption(option, setOptions): boolean {
            return setActiveOption(option, setOptions);
        },

        getSelectedOption(): HTMLElement | null {
            return selectedOption;
        },

        setSelectedOption(option): boolean {
            if (destroyed) {
                return false;
            }

            const nextOption = resolveOption(option);

            if (nextOption === null) {
                selectedOption = null;
                activeOption = null;
                syncAttributes();
                notifyValueChange("programmatic", null);
                return true;
            }

            if (!getOptions().includes(nextOption) || isDisabledOption(nextOption)) {
                return false;
            }

            selectedOption = nextOption;
            input.value = getOptionTextValue(nextOption);
            activeOption = nextOption;
            refresh();
            notifyValueChange("programmatic", null);

            return true;
        },

        setDisabled(nextDisabled): void {
            if (destroyed) {
                return;
            }

            disabled = nextDisabled;

            if (disabled) {
                setOpenState(false, "programmatic");
            }

            syncAttributes();
        },

        isDisabled(): boolean {
            return disabled;
        },

        refresh,

        updatePosition,

        getPositionState(): PopoverPositionState | null {
            return position?.getState() ?? null;
        },

        update(nextOptions: ComboboxUpdateOptions): void {
            if (nextOptions.getOptions !== undefined) getOptions = nextOptions.getOptions;
            if (nextOptions.getOptionText !== undefined) getOptionText = nextOptions.getOptionText;
            if (nextOptions.isOptionDisabled !== undefined) isOptionDisabled = nextOptions.isOptionDisabled;
            if ("filterOption" in nextOptions) filterOption = nextOptions.filterOption;
            if (nextOptions.autocomplete !== undefined) autocomplete = nextOptions.autocomplete;
            if (nextOptions.openOnFocus !== undefined) openOnFocus = nextOptions.openOnFocus;
            if (nextOptions.openOnInput !== undefined) openOnInput = nextOptions.openOnInput;
            if (nextOptions.closeOnBlur !== undefined) closeOnBlur = nextOptions.closeOnBlur;
            if (nextOptions.closeOnEmpty !== undefined) closeOnEmpty = nextOptions.closeOnEmpty;
            if (nextOptions.loop !== undefined) loop = nextOptions.loop;
            if ("onOpenChange" in nextOptions) onOpenChange = nextOptions.onOpenChange ?? null;
            if ("onValueChange" in nextOptions) onValueChange = nextOptions.onValueChange ?? null;
            if ("onActiveOptionChange" in nextOptions) onActiveOptionChange = nextOptions.onActiveOptionChange ?? null;
            if (nextOptions.disabled !== undefined) this.setDisabled(nextOptions.disabled);
            if (nextOptions.inputValue !== undefined) this.setInputValue(nextOptions.inputValue);
            if ("selectedOption" in nextOptions) this.setSelectedOption(nextOptions.selectedOption ?? null);

            if (
                nextOptions.side !== undefined
                || nextOptions.alignment !== undefined
                || nextOptions.strategy !== undefined
                || nextOptions.offset !== undefined
                || nextOptions.crossAxisOffset !== undefined
                || nextOptions.collisionPadding !== undefined
                || nextOptions.flip !== undefined
                || nextOptions.shift !== undefined
                || nextOptions.matchAnchorWidth !== undefined
                || nextOptions.autoUpdate !== undefined
            ) {
                positionOptions = {
                    ...positionOptions,
                    ...getPositionOptions({
                        ...options,
                        ...nextOptions,
                        getOptions
                    })
                };

                destroyPosition();
            }

            if (nextOptions.open !== undefined) {
                setOpenState(nextOptions.open, "programmatic");
            } else {
                refresh();
            }
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;

            for (const cleanup of cleanups) {
                cleanup();
            }

            destroyPosition();
            attributes.restore();

            input.value = originalValue;
            input.disabled = originalDisabled;
        },

        isDestroyed(): boolean {
            return destroyed;
        }
    };

    if (open) {
        updatePosition();
    }

    return combobox;
}
