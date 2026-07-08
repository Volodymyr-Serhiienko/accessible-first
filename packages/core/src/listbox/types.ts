/**
 * Specifies the visual layout directional alignment of the listbox items.
 * Governs which navigation arrow keys are used to cycle through options.
 */
export type ListboxOrientation = "vertical" | "horizontal";

/**
 * Defines the selection constraints for the listbox component.
 * - "single": Only a single choice can be active at a time.
 * - "multiple": Multiple items can be toggled and selected concurrently.
 */
export type ListboxSelectionMode = "single" | "multiple";

/**
 * A proxy reference resolving to an individual listbox option container.
 * Can be a direct `HTMLElement`, a dynamic factory function, or null.
 */
export type ListboxOption =
    | HTMLElement
    | (() => HTMLElement | null)
    | null;

/**
 * Represents one or more option references used to seed or manipulate selected states.
 */
export type ListboxSelectedOptions = ListboxOption | ListboxOption[];

/**
 * Configuration options for initializing an interactive listbox component manager.
 */
export interface ListboxOptions {
    getOptions: () => HTMLElement[];
    orientation?: ListboxOrientation;
    loop?: boolean;
    selectionMode?: ListboxSelectionMode;
    selectionFollowsFocus?: boolean;
    defaultSelectedOptions?: ListboxSelectedOptions;
    isOptionDisabled?: (option: HTMLElement) => boolean;
    onSelectionChange?: (selectedOptions: HTMLElement[]) => void;
}

/**
 * Interface representing a managed accessible listbox component instance.
 * Coordinates selection collections, active focus states, roving indices, 
 * and required ARIA states (`role="listbox"`, `role="option"`, `aria-selected`)
 * for single or multi-select list interfaces.
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
