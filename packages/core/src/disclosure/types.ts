/**
 * Options for createDisclosure().
 */
export interface DisclosureOptions {
    defaultOpen?: boolean;
    disabled?: boolean;
    onOpenChange?: (open: boolean) => void;
}

/**
 * Controller returned by createDisclosure().
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
