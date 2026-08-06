import type { Component } from "../foundation";

/**
 * Visual variant for select.
 */
export type SelectVariant = "default" | "plain";

/**
 * Select size token.
 */
export type SelectSize = "md";

/**
 * Value accepted by select APIs.
 */
export type SelectValue = string | string[];

/**
 * Details passed when native select value changes.
 */
export interface SelectChangeDetail {
    value: string;
    values: string[];
    text: string;
    texts: string[];
    selectedOptions: HTMLOptionElement[];
    selectedIndex: number;
    event: Event;
}

/**
 * Called when select value changes.
 */
export type SelectOnValueChange = (
    detail: SelectChangeDetail,
    select: Select
) => void;

/**
 * Options for createSelect().
 */
export interface SelectOptions {
    disabled?: boolean;
    required?: boolean;
    multiple?: boolean;
    value?: SelectValue;
    name?: string | null;
    variant?: SelectVariant;
    size?: SelectSize;
    /** Number of visible native option rows. Maps to the select size attribute. */
    visibleRows?: number | null;
    onValueChange?: SelectOnValueChange | null;
}

/**
 * Select component controller returned by createSelect().
 */
export interface Select extends Component<HTMLSelectElement> {
    readonly select: HTMLSelectElement;
    getValue(): string;
    getValues(): string[];
    setValue(value: SelectValue): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setRequired(required: boolean): void;
    isRequired(): boolean;
    setMultiple(multiple: boolean): void;
    isMultiple(): boolean;
    update(options: Partial<SelectOptions>): void;
}
