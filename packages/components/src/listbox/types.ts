import type {
    ListboxOption as CoreListboxOption,
    ListboxOptions as CoreListboxOptions,
    ListboxOrientation as CoreListboxOrientation,
    ListboxSelectedOptions as CoreListboxSelectedOptions,
    ListboxSelectionMode as CoreListboxSelectionMode
} from "../../../core/src/listbox";
import type { Component } from "../foundation";

/**
 * Visual variant for listbox.
 */
export type ListboxVariant = "default" | "plain";

/**
 * Listbox size token.
 */
export type ListboxSize = "md";

/**
 * Orientation used by option arrow-key navigation.
 */
export type ListboxOrientation = CoreListboxOrientation;

/**
 * Selection mode for listbox options.
 */
export type ListboxSelectionMode = CoreListboxSelectionMode;

/**
 * Option reference used by default selection.
 */
export type ListboxOption = CoreListboxOption;

/**
 * Initial selected option or options.
 */
export type ListboxSelectedOptions = CoreListboxSelectedOptions;

/**
 * Called when selected options change.
 */
export type ListboxOnSelectionChange = (selectedOptions: HTMLElement[]) => void;

/**
 * Options for createListbox().
 */
export interface ListboxOptions extends Omit<CoreListboxOptions, "onSelectionChange"> {
    selectedOptions?: HTMLElement[];
    variant?: ListboxVariant;
    size?: ListboxSize;
    onSelectionChange?: ListboxOnSelectionChange | null;
}

/**
 * Options accepted by listbox.update().
 */
export interface ListboxUpdateOptions
    extends Partial<
        Omit<
            ListboxOptions,
            | "loop"
            | "orientation"
            | "selectionMode"
            | "selectionFollowsFocus"
            | "typeahead"
            | "typeaheadTimeout"
            | "defaultSelectedOptions"
        >
    > {}

/**
 * Listbox component controller returned by createListbox().
 */
export interface Listbox extends Component {
    readonly listbox: HTMLElement;
    getCurrentOption(): HTMLElement | null;
    setCurrentOption(option: HTMLElement | null, options?: { focus?: boolean }): boolean;
    getSelectedOptions(): HTMLElement[];
    setSelectedOptions(options: HTMLElement[]): void;
    isSelected(option: HTMLElement): boolean;
    selectOption(option: HTMLElement): boolean;
    deselectOption(option: HTMLElement): boolean;
    toggleOption(option: HTMLElement): boolean;
    clearSelection(): void;
    refresh(): void;
    update(options: ListboxUpdateOptions): void;
}
