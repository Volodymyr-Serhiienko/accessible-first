import type {
    Combobox as CoreCombobox,
    ComboboxActiveOptionChangeDetail as CoreComboboxActiveOptionChangeDetail,
    ComboboxActiveOptionChangeReason,
    ComboboxAlignment as CoreComboboxAlignment,
    ComboboxAutocomplete as CoreComboboxAutocomplete,
    ComboboxFilterContext as CoreComboboxFilterContext,
    ComboboxOpenChangeDetail as CoreComboboxOpenChangeDetail,
    ComboboxOpenChangeReason,
    ComboboxOption,
    ComboboxOptions as CoreComboboxOptions,
    ComboboxSide as CoreComboboxSide,
    ComboboxStrategy as CoreComboboxStrategy,
    ComboboxUpdateOptions as CoreComboboxUpdateOptions,
    ComboboxValueChangeDetail as CoreComboboxValueChangeDetail,
    ComboboxValueChangeReason
} from "../../../core/src/combobox";
import type { Component } from "../foundation";

/**
 * Visual variant for combobox.
 */
export type ComboboxVariant = "default" | "plain";

/**
 * Combobox size token.
 */
export type ComboboxSize = "md";

/**
 * Autocomplete mode exposed through aria-autocomplete.
 */
export type ComboboxAutocomplete = CoreComboboxAutocomplete;

/**
 * Context passed to custom option filter functions.
 */
export type ComboboxFilterContext = CoreComboboxFilterContext;

/**
 * Details passed when the combobox popup opens or closes.
 */
export type ComboboxOpenChangeDetail = CoreComboboxOpenChangeDetail;

/**
 * Details passed when the combobox input value changes.
 */
export type ComboboxValueChangeDetail = CoreComboboxValueChangeDetail;

/**
 * Details passed when the active popup option changes.
 */
export type ComboboxActiveOptionChangeDetail = CoreComboboxActiveOptionChangeDetail;

/**
 * Called when the combobox popup opens or closes.
 */
export type ComboboxOnOpenChange = (
    detail: ComboboxOpenChangeDetail,
    combobox: Combobox
) => void;

/**
 * Called when the combobox input value changes.
 */
export type ComboboxOnValueChange = (
    detail: ComboboxValueChangeDetail,
    combobox: Combobox
) => void;

/**
 * Called when the active popup option changes.
 */
export type ComboboxOnActiveOptionChange = (
    detail: ComboboxActiveOptionChangeDetail,
    combobox: Combobox
) => void;

/**
 * Options for createCombobox().
 */
export interface ComboboxOptions
    extends Omit<
        CoreComboboxOptions,
        "onOpenChange" | "onValueChange" | "onActiveOptionChange"
    > {
    variant?: ComboboxVariant;
    size?: ComboboxSize;
    onOpenChange?: ComboboxOnOpenChange | null;
    onValueChange?: ComboboxOnValueChange | null;
    onActiveOptionChange?: ComboboxOnActiveOptionChange | null;
}

/**
 * Options accepted by combobox.update().
 */
export interface ComboboxUpdateOptions
    extends Partial<
        Omit<
            ComboboxOptions,
            "defaultOpen" | "defaultInputValue" | "defaultSelectedOption"
        >
    > {}

/**
 * Combobox component controller returned by createCombobox().
 */
export interface Combobox
    extends Omit<CoreCombobox, "update" | "destroy" | "isDestroyed">,
        Component<HTMLInputElement> {
    readonly input: HTMLInputElement;
    readonly listbox: HTMLElement;
    update(options: ComboboxUpdateOptions): void;
}

/**
 * Re-exported combobox popup placement side.
 */
export type ComboboxSide = CoreComboboxSide;

/**
 * Re-exported combobox popup cross-axis alignment.
 */
export type ComboboxAlignment = CoreComboboxAlignment;

/**
 * Re-exported combobox popup CSS positioning strategy.
 */
export type ComboboxStrategy = CoreComboboxStrategy;

export type {
    ComboboxActiveOptionChangeReason,
    ComboboxOpenChangeReason,
    ComboboxOption,
    ComboboxValueChangeReason,
    CoreComboboxUpdateOptions
};
