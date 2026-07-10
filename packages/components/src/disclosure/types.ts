import type { Component } from "../foundation";

/**
 * Defines the presentation or layout rendering mode variations for a disclosure container.
 */
export type DisclosureVariant = "default" | "plain";

/**
 * Defines the spacing, layout padding, or dimensional size constraint of a disclosure block.
 */
export type DisclosureSize = "md";

/**
 * Configuration options utilized to instantiate an accessible structural disclosure component.
 */
export interface DisclosureOptions {
    trigger: HTMLElement;
    panel: HTMLElement;
    defaultOpen?: boolean;
    open?: boolean;
    disabled?: boolean;
    variant?: DisclosureVariant;
    size?: DisclosureSize;
    onOpenChange?: ((open: boolean) => void) | null;
}

/**
 * Interface representing an accessible interactive disclosure accordion component.
 * Synchronizes visibility states (`aria-expanded`) and structural relationships (`aria-controls`) 
 * seamlessly across custom trigger elements and text panel nodes.
 */
export interface Disclosure extends Component {
    readonly trigger: HTMLElement;
    readonly panel: HTMLElement;
    open(): void;
    close(): void;
    toggle(): void;
    setOpen(open: boolean): void;
    isOpen(): boolean;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    update(options: Partial<DisclosureOptions>): void;
}
