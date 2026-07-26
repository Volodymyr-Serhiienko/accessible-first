import type {
    DialogElement,
    DialogOptions as CoreDialogOptions,
    DialogRole
} from "../../../core/src/dialog";
import type { DismissableLayerEvent } from "../../../core/src/dismissable-layer";
import type { OverlayStack } from "../../../core/src/overlay-stack";
import type { Component } from "../foundation";

/**
 * Visual styling configurations permitted for transforming the underlying structural layout treatment of a dialog overlay.
 */
export type DialogVariant = "default" | "plain";

/**
 * Standard structural padding, sizing, and viewport dimension presets permitted for a dialog modal container.
 */
export type DialogSize = "md";

/**
 * Global orchestration parameters configuring accessibility role semantics, focus trap rules, 
 * layer dismissal triggers, and overlay stack behaviors for a modal or non-modal dialog layer.
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
    variant?: DialogVariant;
    size?: DialogSize;
    onEscapeKeyDown?: (event: DismissableLayerEvent<KeyboardEvent>) => void;
    onPointerDownOutside?: (event: DismissableLayerEvent<PointerEvent>) => void;
    onFocusOutside?: (event: DismissableLayerEvent<FocusEvent>) => void;
    onOpenChange?: ((open: boolean) => void) | null;
}

/**
 * Main coordinator component managing focus entrapment, accessibility state matrixes, 
 * and layer dismissal behaviors for an interactive dialog surface.
 */
export interface Dialog extends Component {
    readonly trigger: HTMLElement | null;
    readonly surface: HTMLElement;
    open(): void;
    close(): void;
    toggle(): void;
    setOpen(open: boolean): void;
    isOpen(): boolean;
    update(options: Partial<DialogOptions>): void;
}

export type { DialogElement, DialogRole };
