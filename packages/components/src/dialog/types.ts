import type {
    DialogElement,
    DialogOptions as CoreDialogOptions,
    DialogRole
} from "../../../core/src/dialog";
import type { DismissableLayerEvent } from "../../../core/src/dismissable-layer";
import type { OverlayStack } from "../../../core/src/overlay-stack";
import type { Component } from "../foundation";

/**
 * Visual variant for a dialog.
 */
export type DialogVariant = "default" | "plain";

/**
 * Dialog size token.
 */
export type DialogSize = "md";

/**
 * Options for createDialog().
 */
export interface DialogOptions extends Omit<CoreDialogOptions, "onOpenChange"> {
    open?: boolean;
    trigger?: HTMLElement | null;
    closeElements?: HTMLElement[];
    surface?: HTMLElement | null;
    dismissOnPointerDownOutside?: boolean;
    dismissOnFocusOutside?: boolean;
    useOverlayStack?: boolean;
    overlayStack?: OverlayStack;
    lockScroll?: boolean;
    variant?: DialogVariant;
    size?: DialogSize;
    onEscapeKeyDown?: ((event: DismissableLayerEvent<KeyboardEvent>) => void) | null;
    onPointerDownOutside?: ((event: DismissableLayerEvent<PointerEvent>) => void) | null;
    onFocusOutside?: ((event: DismissableLayerEvent<FocusEvent>) => void) | null;
    onOpenChange?: ((open: boolean) => void) | null;
}

/**
 * Options accepted by dialog.update().
 *
 * Focus-trap setup, initial focus, defaultOpen, surface, and overlay stack
 * wiring are creation-time options.
 */
export interface DialogUpdateOptions
    extends Partial<
        Omit<
            DialogOptions,
            | "defaultOpen"
            | "trapFocus"
            | "restoreFocus"
            | "initialFocus"
            | "fallbackFocus"
            | "surface"
            | "useOverlayStack"
            | "overlayStack"
        >
    > {}

/**
 * Dialog behavior controller returned by createDialog().
 */
export interface Dialog extends Component {
    readonly trigger: HTMLElement | null;
    readonly surface: HTMLElement;
    open(): void;
    close(): void;
    toggle(): void;
    setOpen(open: boolean): void;
    isOpen(): boolean;
    update(options: DialogUpdateOptions): void;
}

export type { DialogElement, DialogRole };
