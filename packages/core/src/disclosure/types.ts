/**
 * Configuration options for initializing a disclosure (expandable/collapsible) component.
 */
export interface DisclosureOptions {
    defaultOpen?: boolean;
    disabled?: boolean;
    onOpenChange?: (open: boolean) => void;
}

/**
 * Interface representing a managed disclosure component instance.
 * Coordinates an interactive trigger element with an expandable content panel 
 * following accessible disclosure patterns.
 */
export interface Disclosure {
    readonly trigger: HTMLElement;
    readonly panel: HTMLElement;
    open(): void;
    close(): void;
    toggle(): void;
    setOpen(open: boolean): void;
    isOpen(): boolean;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    destroy(): void;
}
