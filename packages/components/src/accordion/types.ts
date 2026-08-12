import type { Component } from "../foundation";
import type { DisclosureAnnouncement, DisclosureInstance } from "../disclosure";

/**
 * Visual variant for an accordion.
 */
export type AccordionVariant = "default" | "plain";

/**
 * Accordion size token.
 */
export type AccordionSize = "md";

/**
 * Native heading level used by composed accordion item headings.
 */
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Panel landmark strategy.
 * "auto" uses region only for smaller accordions.
 */
export type AccordionPanelRole = "auto" | "region" | "none";

/**
 * Options for one accordion item.
 */
export interface AccordionItemOptions {
    element: HTMLElement;
    trigger: HTMLElement;
    panel: HTMLElement;
    value?: string;
    disabled?: boolean;
    defaultOpen?: boolean;
    open?: boolean;
    announcement?: DisclosureAnnouncement;
}

/**
 * Details passed to accordion open-change callbacks.
 */
export interface AccordionOpenChangeDetail {
    value: string;
    open: boolean;
    item: AccordionItem;
}

/**
 * Options for createAccordion().
 */
export interface AccordionOptions {
    items: AccordionItemOptions[];
    multiple?: boolean;
    collapsible?: boolean;
    disabled?: boolean;
    loop?: boolean;
    variant?: AccordionVariant;
    size?: AccordionSize;
    announcement?: DisclosureAnnouncement;
    onOpenChange?: ((detail: AccordionOpenChangeDetail) => void) | null;
}

/**
 * Options accepted by accordion.update().
 *
 * Item registration is creation-time only. Use item controllers to open,
 * close, or disable individual items.
 */
export interface AccordionUpdateOptions extends Partial<Omit<AccordionOptions, "items">> {}

/**
 * Runtime controller for one accordion item.
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
 * Accordion behavior controller returned by createAccordion().
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
    update(options: AccordionUpdateOptions): void;
}
