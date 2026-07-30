/**
 * Listbox orientation used by arrow-key navigation.
 */
export type ListboxOrientation = "vertical" | "horizontal";

/**
 * Selection mode for listbox options.
 */
export type ListboxSelectionMode = "single" | "multiple";

/**
 * Listbox option reference.
 */
export type ListboxOption =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Initial selected option or options.
 */
export type ListboxSelectedOptions = ListboxOption | ListboxOption[];

/**
 * Options for createListbox().
 */
export interface ListboxOptions {
    getOptions: () => HTMLElement[];
    orientation?: ListboxOrientation;
    loop?: boolean;
    selectionMode?: ListboxSelectionMode;
    selectionFollowsFocus?: boolean;
    typeahead?: boolean;
    typeaheadTimeout?: number;
    getOptionText?: (option: HTMLElement) => string;
    defaultSelectedOptions?: ListboxSelectedOptions;
    isOptionDisabled?: (option: HTMLElement) => boolean;
    onSelectionChange?: (selectedOptions: HTMLElement[]) => void;
}

/**
 * Controller returned by createListbox().
 */
export interface Listbox {
    readonly element: HTMLElement;
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
    destroy(): void;
}
