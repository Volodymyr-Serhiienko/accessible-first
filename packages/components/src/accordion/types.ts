import type { Component } from "../foundation";
import type { DisclosureInstance } from "../disclosure";

/**
 * Visual styling configurations permitted for transforming the underlying structural layout treatment of an accordion.
 */
export type AccordionVariant = "default" | "plain";

/**
 * Standard structural padding, sizing, and typography dimension presets permitted for an accordion layout region.
 */
export type AccordionSize = "md";

/**
 * Configuration characteristics defining the essential native layout nodes, identifying keys,
 * and primitive toggle state tracking criteria required to compose a single accordion regional segment.
 */
export interface AccordionItemOptions {
    element: HTMLElement;
    trigger: HTMLElement;
    panel: HTMLElement;
    value?: string;
    disabled?: boolean;
    defaultOpen?: boolean;
    open?: boolean;
}

/**
 * Event notification details packed and dispatched when any individual accordion section mutates its display state.
 */
export interface AccordionOpenChangeDetail {
    value: string;
    open: boolean;
    item: AccordionItem;
}

/**
 * Global orchestration parameters configuring structural behavior rules, keyboard navigation loops,
 * and state dispatch mechanisms for a coordinated set of accordion items.
 */
export interface AccordionOptions {
    items: AccordionItemOptions[];
    multiple?: boolean;
    collapsible?: boolean;
    disabled?: boolean;
    loop?: boolean;
    variant?: AccordionVariant;
    size?: AccordionSize;
    onOpenChange?: ((detail: AccordionOpenChangeDetail) => void) | null;
}

/**
 * Represents the compiled runtime model, disclosure drivers, and isolated status accessors 
 * managing an active accordion item segment.
 */
export interface AccordionItem {
    readonly value: string;
    readonly element: HTMLElement;
    readonly trigger: HTMLElement;
    readonly panel: HTMLElement;
    readonly disclosure: DisclosureInstance;
    open(): void;
    close(): void;
    toggle(): void;
    setOpen(open: boolean): void;
    isOpen(): boolean;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
}

/**
 * Main coordinator component managing the accessibility matrix, keyboard focus patterns,
 * and visual disclosure state variations across a group of nested accordion segments.
 */
export interface Accordion extends Component {
    readonly items: AccordionItem[];
    openItem(value: string): void;
    closeItem(value: string): void;
    toggleItem(value: string): void;
    setItemOpen(value: string, open: boolean): void;
    getItem(value: string): AccordionItem | null;
    getOpenValues(): string[];
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    refresh(): void;
    update(options: Partial<Omit<AccordionOptions, "items">>): void;
}
