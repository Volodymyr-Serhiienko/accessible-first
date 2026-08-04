import {
    Button,
    type ButtonCompositionOptions,
    type ButtonSize,
    type ButtonVariant,
    type ComposedButton
} from "../button";
import {
    Dialog,
    type ComposedDialog,
    type DialogCompositionOptions
} from "../dialog";

/**
 * Initial focus preset for AlertDialog().
 *
 * "cancel" is the default because it puts keyboard and screen reader users on
 * the safer action first. Use "confirm" only when confirmation is harmless or
 * clearly expected.
 */
export type AlertDialogFocusTarget = "cancel" | "confirm";

/**
 * Called when the confirm or cancel action is activated.
 *
 * Call event.preventDefault() inside the handler to keep the alert dialog open,
 * for example while waiting for async validation.
 */
export type AlertDialogCompositionOnAction = (
    event: Event,
    alertDialog: ComposedAlertDialog
) => void;

/**
 * Called when the composed alert dialog opens or closes.
 */
export type AlertDialogCompositionOnOpenChange = (
    open: boolean,
    alertDialog: ComposedAlertDialog
) => void;

/**
 * Options for AlertDialog().
 *
 * AlertDialog is a stricter Dialog preset for important confirmations:
 * it uses role="alertdialog", connects the description with aria-describedby,
 * focuses the safer cancel action by default, and prevents outside pointer
 * dismissal unless explicitly changed.
 */
export interface AlertDialogCompositionOptions
    extends Omit<
        DialogCompositionOptions,
        | "actions"
        | "closeText"
        | "hideCloseButton"
        | "role"
        | "description"
        | "descriptionMode"
        | "initialFocus"
        | "initialFocusTarget"
        | "onOpenChange"
    > {
    description: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: ButtonVariant;
    cancelVariant?: ButtonVariant;
    confirmSize?: ButtonSize;
    cancelSize?: ButtonSize;
    confirmDisabled?: boolean;
    cancelDisabled?: boolean;
    focusTarget?: AlertDialogFocusTarget;
    onConfirm?: AlertDialogCompositionOnAction | null;
    onCancel?: AlertDialogCompositionOnAction | null;
    onOpenChange?: AlertDialogCompositionOnOpenChange | null;
}

/**
 * Alert dialog created by the composition API.
 *
 * It exposes the underlying dialog controller plus direct access to the cancel
 * and confirm buttons for imperative updates.
 */
export interface ComposedAlertDialog
    extends Omit<ComposedDialog, "closeButton" | "setActions" | "update" | "destroy"> {
    readonly cancelButton: HTMLButtonElement;
    readonly confirmButton: HTMLButtonElement;
    setCancelText(text: string): void;
    setConfirmText(text: string): void;
    setCancelDisabled(disabled: boolean): void;
    setConfirmDisabled(disabled: boolean): void;
    update(options: Partial<AlertDialogCompositionOptions>): void;
    destroy(): void;
}

function getInitialFocus(
    target: AlertDialogFocusTarget,
    cancelButton: ComposedButton,
    confirmButton: ComposedButton
): HTMLElement | null {
    const preferred = target === "confirm"
        ? confirmButton.element
        : cancelButton.element;

    const fallback = target === "confirm"
        ? cancelButton.element
        : confirmButton.element;

    if (!preferred.disabled) return preferred;
    if (!fallback.disabled) return fallback;

    return null;
}

function getActionButtonOptions(
    text: string,
    variant: ButtonVariant,
    size: ButtonSize | undefined,
    disabled: boolean | undefined,
    onPress: (event: Event) => void
): ButtonCompositionOptions {
    const buttonOptions: ButtonCompositionOptions = {
        text,
        variant,
        onPress
    };

    if (size !== undefined) buttonOptions.size = size;
    if (disabled !== undefined) buttonOptions.disabled = disabled;

    return buttonOptions;
}

function assignDialogOptions(
    target: Partial<DialogCompositionOptions>,
    options: Partial<AlertDialogCompositionOptions>
): void {
    if (options.id !== undefined) target.id = options.id;
    if (options.className !== undefined) target.className = options.className;
    if (options.attributes !== undefined) target.attributes = options.attributes;
    if (options.trigger !== undefined) target.trigger = options.trigger;
    if (options.title !== undefined) target.title = options.title;
    if (options.description !== undefined) target.description = options.description;
    if (options.titleId !== undefined) target.titleId = options.titleId;
    if (options.descriptionId !== undefined) target.descriptionId = options.descriptionId;
    if (options.children !== undefined) target.children = options.children;
    if (options.defaultOpen !== undefined) target.defaultOpen = options.defaultOpen;
    if (options.open !== undefined) target.open = options.open;
    if (options.modal !== undefined) target.modal = options.modal;
    if (options.lockScroll !== undefined) target.lockScroll = options.lockScroll;
    if (options.trapFocus !== undefined) target.trapFocus = options.trapFocus;
    if (options.closeOnEscape !== undefined) target.closeOnEscape = options.closeOnEscape;
    if (options.restoreFocus !== undefined) target.restoreFocus = options.restoreFocus;
    if (options.dismissOnPointerDownOutside !== undefined) {
        target.dismissOnPointerDownOutside = options.dismissOnPointerDownOutside;
    }
    if (options.dismissOnFocusOutside !== undefined) {
        target.dismissOnFocusOutside = options.dismissOnFocusOutside;
    }
    if (options.useOverlayStack !== undefined) target.useOverlayStack = options.useOverlayStack;
    if (options.overlayStack !== undefined) target.overlayStack = options.overlayStack;
    if (options.variant !== undefined) target.variant = options.variant;
    if (options.size !== undefined) target.size = options.size;
    if (options.triggerVariant !== undefined) target.triggerVariant = options.triggerVariant;
    if (options.triggerSize !== undefined) target.triggerSize = options.triggerSize;

    if ("onEscapeKeyDown" in options) {
        target.onEscapeKeyDown = options.onEscapeKeyDown ?? null;
    }

    if ("onPointerDownOutside" in options) {
        target.onPointerDownOutside = options.onPointerDownOutside ?? null;
    }

    if ("onFocusOutside" in options) {
        target.onFocusOutside = options.onFocusOutside ?? null;
    }
}

function getDialogOptions(
    options: AlertDialogCompositionOptions,
    cancelButton: ComposedButton,
    confirmButton: ComposedButton,
    getFocusTarget: () => AlertDialogFocusTarget,
    onOpenChange: (open: boolean) => void
): DialogCompositionOptions {
    const dialogOptions: DialogCompositionOptions = {
        trigger: options.trigger,
        title: options.title,
        description: options.description,
        role: "alertdialog",
        descriptionMode: "aria",
        hideCloseButton: true,
        actions: [cancelButton, confirmButton],
        initialFocus: () => getInitialFocus(getFocusTarget(), cancelButton, confirmButton),
        dismissOnPointerDownOutside: options.dismissOnPointerDownOutside ?? false,
        onOpenChange
    };

    assignDialogOptions(dialogOptions, options);

    return dialogOptions;
}

function getDialogUpdateOptions(
    options: Partial<AlertDialogCompositionOptions>,
    onOpenChange: (open: boolean) => void
): Partial<DialogCompositionOptions> {
    const dialogOptions: Partial<DialogCompositionOptions> = {};

    assignDialogOptions(dialogOptions, options);

    if ("onOpenChange" in options) {
        dialogOptions.onOpenChange = onOpenChange;
    }

    return dialogOptions;
}

function getCancelButtonUpdateOptions(
    options: Partial<AlertDialogCompositionOptions>
): ButtonCompositionOptions {
    const buttonOptions: ButtonCompositionOptions = {};

    if (options.cancelText !== undefined) buttonOptions.text = options.cancelText;
    if (options.cancelVariant !== undefined) buttonOptions.variant = options.cancelVariant;
    if (options.cancelSize !== undefined) buttonOptions.size = options.cancelSize;
    if (options.cancelDisabled !== undefined) buttonOptions.disabled = options.cancelDisabled;

    return buttonOptions;
}

function getConfirmButtonUpdateOptions(
    options: Partial<AlertDialogCompositionOptions>
): ButtonCompositionOptions {
    const buttonOptions: ButtonCompositionOptions = {};

    if (options.confirmText !== undefined) buttonOptions.text = options.confirmText;
    if (options.confirmVariant !== undefined) buttonOptions.variant = options.confirmVariant;
    if (options.confirmSize !== undefined) buttonOptions.size = options.confirmSize;
    if (options.confirmDisabled !== undefined) buttonOptions.disabled = options.confirmDisabled;

    return buttonOptions;
}

/**
 * Creates an alert dialog for important confirmations and destructive actions.
 */
export function AlertDialog(options: AlertDialogCompositionOptions): ComposedAlertDialog {
    let composed!: ComposedAlertDialog;
    let onConfirm = options.onConfirm ?? null;
    let onCancel = options.onCancel ?? null;
    let onOpenChange = options.onOpenChange ?? null;
    let focusTarget: AlertDialogFocusTarget = options.focusTarget ?? "cancel";

    const cancelButton = Button(getActionButtonOptions(
        options.cancelText ?? "Cancel",
        options.cancelVariant ?? "secondary",
        options.cancelSize,
        options.cancelDisabled,
        (event) => {
            onCancel?.(event, composed);

            if (!event.defaultPrevented) {
                composed.close();
            }
        }
    ));

    const confirmButton = Button(getActionButtonOptions(
        options.confirmText ?? "Confirm",
        options.confirmVariant ?? "danger",
        options.confirmSize,
        options.confirmDisabled,
        (event) => {
            onConfirm?.(event, composed);

            if (!event.defaultPrevented) {
                composed.close();
            }
        }
    ));

    const handleOpenChange = (open: boolean): void => {
        onOpenChange?.(open, composed);
    };

    const dialog = Dialog(getDialogOptions(
        options,
        cancelButton,
        confirmButton,
        () => focusTarget,
        handleOpenChange
    ));

    composed = {
        ...dialog,
        cancelButton: cancelButton.element,
        confirmButton: confirmButton.element,

        setCancelText(text: string): void {
            cancelButton.setText(text);
        },

        setConfirmText(text: string): void {
            confirmButton.setText(text);
        },

        setCancelDisabled(disabled: boolean): void {
            cancelButton.setDisabled(disabled);
        },

        setConfirmDisabled(disabled: boolean): void {
            confirmButton.setDisabled(disabled);
        },

        update(nextOptions: Partial<AlertDialogCompositionOptions>): void {
            if ("onConfirm" in nextOptions) {
                onConfirm = nextOptions.onConfirm ?? null;
            }

            if ("onCancel" in nextOptions) {
                onCancel = nextOptions.onCancel ?? null;
            }

            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if (nextOptions.focusTarget !== undefined) {
                focusTarget = nextOptions.focusTarget;
            }

            cancelButton.update(getCancelButtonUpdateOptions(nextOptions));
            confirmButton.update(getConfirmButtonUpdateOptions(nextOptions));
            dialog.update(getDialogUpdateOptions(nextOptions, handleOpenChange));
        },

        destroy(): void {
            dialog.destroy();
        }
    };

    return composed;
}
