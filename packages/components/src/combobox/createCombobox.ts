import {
    createCombobox as createComboboxBehavior,
    type ComboboxOptions as CoreComboboxOptions,
    type ComboboxUpdateOptions as CoreComboboxUpdateOptions
} from "../../../core/src/combobox";
import {
    createAttributeSnapshot,
    restoreAttribute
} from "../../../core/src/dom";
import { createComponentLifecycle } from "../foundation";
import type {
    Combobox,
    ComboboxOptions,
    ComboboxSize,
    ComboboxUpdateOptions,
    ComboboxVariant
} from "./types";

function applyCoreOptions(
    source: ComboboxOptions | ComboboxUpdateOptions,
    target: CoreComboboxOptions | CoreComboboxUpdateOptions
): void {
    if (source.getOptions !== undefined) target.getOptions = source.getOptions;
    if (source.getOptionText !== undefined) target.getOptionText = source.getOptionText;
    if (source.isOptionDisabled !== undefined) target.isOptionDisabled = source.isOptionDisabled;
    if ("filterOption" in source) target.filterOption = source.filterOption ?? null;
    if (source.inputValue !== undefined) target.inputValue = source.inputValue;
    if ("selectedOption" in source) target.selectedOption = source.selectedOption ?? null;
    if (source.autocomplete !== undefined) target.autocomplete = source.autocomplete;
    if (source.disabled !== undefined) target.disabled = source.disabled;
    if (source.open !== undefined) target.open = source.open;
    if (source.openOnFocus !== undefined) target.openOnFocus = source.openOnFocus;
    if (source.openOnInput !== undefined) target.openOnInput = source.openOnInput;
    if (source.closeOnBlur !== undefined) target.closeOnBlur = source.closeOnBlur;
    if (source.closeOnEmpty !== undefined) target.closeOnEmpty = source.closeOnEmpty;
    if (source.loop !== undefined) target.loop = source.loop;
    if (source.side !== undefined) target.side = source.side;
    if (source.alignment !== undefined) target.alignment = source.alignment;
    if (source.strategy !== undefined) target.strategy = source.strategy;
    if (source.offset !== undefined) target.offset = source.offset;
    if (source.crossAxisOffset !== undefined) target.crossAxisOffset = source.crossAxisOffset;
    if (source.collisionPadding !== undefined) target.collisionPadding = source.collisionPadding;
    if (source.flip !== undefined) target.flip = source.flip;
    if (source.shift !== undefined) target.shift = source.shift;
    if (source.matchAnchorWidth !== undefined) target.matchAnchorWidth = source.matchAnchorWidth;
    if (source.autoUpdate !== undefined) target.autoUpdate = source.autoUpdate;
}

function getCoreComboboxOptions(
    options: ComboboxOptions,
    onOpenChange: NonNullable<CoreComboboxOptions["onOpenChange"]>,
    onValueChange: NonNullable<CoreComboboxOptions["onValueChange"]>,
    onActiveOptionChange: NonNullable<CoreComboboxOptions["onActiveOptionChange"]>
): CoreComboboxOptions {
    const coreOptions: CoreComboboxOptions = {
        getOptions: options.getOptions,
        onOpenChange,
        onValueChange,
        onActiveOptionChange
    };

    applyCoreOptions(options, coreOptions);

    if (options.openOnFocus === undefined) {
        coreOptions.openOnFocus = true;
    }

    if (options.defaultInputValue !== undefined) {
        coreOptions.defaultInputValue = options.defaultInputValue;
    }

    if ("defaultSelectedOption" in options) {
        coreOptions.defaultSelectedOption = options.defaultSelectedOption ?? null;
    }

    if (options.defaultOpen !== undefined) {
        coreOptions.defaultOpen = options.defaultOpen;
    }

    return coreOptions;
}

function getCoreComboboxUpdateOptions(
    options: ComboboxUpdateOptions
): CoreComboboxUpdateOptions {
    const coreOptions: CoreComboboxUpdateOptions = {};

    applyCoreOptions(options, coreOptions);

    return coreOptions;
}

/**
 * Enhances an input and listbox popup with Accessible First combobox behavior.
 */
export function createCombobox(
    input: HTMLInputElement,
    listbox: HTMLElement,
    options: ComboboxOptions
): Combobox {
    const lifecycle = createComponentLifecycle(input, {
        name: "combobox",
        initialState: (options.disabled ?? input.disabled) ? "disabled" : "ready"
    });

    const attributes = createAttributeSnapshot();

    const originalVariant = input.getAttribute("data-af-variant");
    const originalSize = input.getAttribute("data-af-size");
    const originalListboxMarker = listbox.getAttribute("data-af-combobox-listbox");

    let variant: ComboboxVariant = options.variant ?? "default";
    let size: ComboboxSize = options.size ?? "md";
    let getOptions = options.getOptions;
    let onOpenChange = options.onOpenChange ?? null;
    let onValueChange = options.onValueChange ?? null;
    let onActiveOptionChange = options.onActiveOptionChange ?? null;
    let component!: Combobox;

    const combobox = createComboboxBehavior(
        input,
        listbox,
        getCoreComboboxOptions(
            options,
            (detail) => onOpenChange?.(detail, component),
            (detail) => onValueChange?.(detail, component),
            (detail) => onActiveOptionChange?.(detail, component)
        )
    );

    function syncOptionMarkers(): void {
        for (const option of getOptions()) {
            attributes.remember(option, "data-af-combobox-option");
            option.setAttribute("data-af-combobox-option", "");
        }
    }

    function syncAttributes(): void {
        input.setAttribute("data-af-variant", variant);
        input.setAttribute("data-af-size", size);
        listbox.setAttribute("data-af-combobox-listbox", "");
        lifecycle.setState(combobox.isDisabled() ? "disabled" : "ready");
        syncOptionMarkers();
    }

    syncAttributes();

    lifecycle.addCleanup(() => {
        restoreAttribute(input, "data-af-variant", originalVariant);
        restoreAttribute(input, "data-af-size", originalSize);
        restoreAttribute(listbox, "data-af-combobox-listbox", originalListboxMarker);
        attributes.restore();
    });

    lifecycle.addCleanup(() => combobox.destroy());

    component = {
        ...combobox,
        element: input,
        input,
        listbox,

        setDisabled(disabled): void {
            combobox.setDisabled(disabled);
            syncAttributes();
        },

        refresh(): void {
            combobox.refresh();
            syncAttributes();
        },

        update(nextOptions): void {
            if (nextOptions.getOptions !== undefined) {
                getOptions = nextOptions.getOptions;
            }

            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if ("onValueChange" in nextOptions) {
                onValueChange = nextOptions.onValueChange ?? null;
            }

            if ("onActiveOptionChange" in nextOptions) {
                onActiveOptionChange = nextOptions.onActiveOptionChange ?? null;
            }

            if (nextOptions.variant !== undefined) {
                variant = nextOptions.variant;
            }

            if (nextOptions.size !== undefined) {
                size = nextOptions.size;
            }

            combobox.update(getCoreComboboxUpdateOptions(nextOptions));
            syncAttributes();
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };

    return component;
}
