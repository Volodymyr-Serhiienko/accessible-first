import type {
    PopoverPositionAlignment,
    PopoverPositionOptions,
    PopoverPositionSide,
    PopoverPositionState,
    PopoverPositionStrategy
} from "../popover-position";

/**
 * Option reference accepted by combobox APIs.
 */
export type ComboboxOption =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Autocomplete mode exposed through aria-autocomplete.
 */
export type ComboboxAutocomplete = "none" | "list";

/**
 * Reason why the combobox popup changed open state.
 */
export type ComboboxOpenChangeReason =
    | "input"
    | "keyboard"
    | "pointer"
    | "outside"
    | "blur"
    | "selection"
    | "programmatic";

/**
 * Reason why the combobox input value changed.
 */
export type ComboboxValueChangeReason =
    | "input"
    | "selection"
    | "programmatic";

/**
 * Reason why the active popup option changed.
 */
export type ComboboxActiveOptionChangeReason =
    | "keyboard"
    | "pointer"
    | "input"
    | "programmatic";

/**
 * Context passed to custom option filter functions.
 */
export interface ComboboxFilterContext {
    readonly inputValue: string;
    readonly option: HTMLElement;
    readonly optionText: string;
}

/**
 * Details passed when the combobox popup opens or closes.
 */
export interface ComboboxOpenChangeDetail {
    open: boolean;
    reason: ComboboxOpenChangeReason;
    input: HTMLInputElement;
    listbox: HTMLElement;
}

/**
 * Details passed when the combobox input value changes.
 */
export interface ComboboxValueChangeDetail {
    inputValue: string;
    selectedOption: HTMLElement | null;
    reason: ComboboxValueChangeReason;
    event: Event | null;
}

/**
 * Details passed when the active popup option changes.
 */
export interface ComboboxActiveOptionChangeDetail {
    activeOption: HTMLElement | null;
    inputValue: string;
    reason: ComboboxActiveOptionChangeReason;
}

/**
 * Options for createCombobox().
 */
export interface ComboboxOptions extends PopoverPositionOptions {
    getOptions: () => HTMLElement[];
    getOptionText?: (option: HTMLElement) => string;
    isOptionDisabled?: (option: HTMLElement) => boolean;
    filterOption?: ((context: ComboboxFilterContext) => boolean) | null;
    inputValue?: string;
    defaultInputValue?: string;
    selectedOption?: ComboboxOption;
    defaultSelectedOption?: ComboboxOption;
    autocomplete?: ComboboxAutocomplete;
    disabled?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    openOnFocus?: boolean;
    openOnInput?: boolean;
    closeOnBlur?: boolean;
    closeOnEmpty?: boolean;
    loop?: boolean;
    dismissKeyboardOnSelection?: boolean;
    onOpenChange?: ((detail: ComboboxOpenChangeDetail, combobox: Combobox) => void) | null;
    onValueChange?: ((detail: ComboboxValueChangeDetail, combobox: Combobox) => void) | null;
    onActiveOptionChange?: ((detail: ComboboxActiveOptionChangeDetail, combobox: Combobox) => void) | null;
}

/**
 * Options accepted by combobox.update().
 *
 * defaultOpen, defaultInputValue, and defaultSelectedOption are creation-time options.
 */
export interface ComboboxUpdateOptions
    extends Partial<Omit<ComboboxOptions, "defaultOpen" | "defaultInputValue" | "defaultSelectedOption">> {}

/**
 * Combobox behavior controller returned by createCombobox().
 */
export interface Combobox {
    readonly input: HTMLInputElement;
    readonly listbox: HTMLElement;
    open(): void;
    close(): void;
    toggle(): void;
    isOpen(): boolean;
    getInputValue(): string;
    setInputValue(value: string): void;
    getVisibleOptions(): HTMLElement[];
    getActiveOption(): HTMLElement | null;
    setActiveOption(option: ComboboxOption, options?: { scroll?: boolean }): boolean;
    getSelectedOption(): HTMLElement | null;
    setSelectedOption(option: ComboboxOption): boolean;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    refresh(): void;
    updatePosition(): PopoverPositionState | null;
    getPositionState(): PopoverPositionState | null;
    update(options: ComboboxUpdateOptions): void;
    destroy(): void;
    isDestroyed(): boolean;
}

/**
 * Re-exported combobox popup placement side.
 */
export type ComboboxSide = PopoverPositionSide;

/**
 * Re-exported combobox popup cross-axis alignment.
 */
export type ComboboxAlignment = PopoverPositionAlignment;

/**
 * Re-exported combobox popup CSS positioning strategy.
 */
export type ComboboxStrategy = PopoverPositionStrategy;
