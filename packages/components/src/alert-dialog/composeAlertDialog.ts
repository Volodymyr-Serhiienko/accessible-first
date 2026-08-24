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
    type DialogCompositionOptions,
    type DialogCompositionUpdateOptions
} from "../dialog";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";

/**
 * Initial focus preset for AlertDialog().
 *
 * "cancel" is the default because it puts keyboard and screen reader users on
 * the safer action first. Use "confirm" only when confirmation is harmless or
 * clearly expected.
 */
export type AlertDialogFocusTarget = "cancel" | "confirm";

/**
 * Localized message keys used by AlertDialog action fallbacks.
 */
export type AlertDialogMessageKey =
    | "alertDialog.cancelText"
    | "alertDialog.confirmText";

/**
 * Localization provider accepted by AlertDialog.
 */
export type AlertDialogLocalization = LocaleTextProvider<AlertDialogMessageKey>;

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
        | "locale"
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
    locale?: AlertDialogLocalization | null;
    onConfirm?: AlertDialogCompositionOnAction | null;
    onCancel?: AlertDialogCompositionOnAction | null;
    onOpenChange?: AlertDialogCompositionOnOpenChange | null;
}

/**
 * Options accepted by ComposedAlertDialog.update().
 *
 * defaultOpen, trapFocus, restoreFocus, fallbackFocus, and overlay stack wiring
 * are creation-time options inherited from Dialog.
 */
export interface AlertDialogCompositionUpdateOptions
    extends Partial<
        Omit<
            AlertDialogCompositionOptions,
            | "defaultOpen"
            | "trapFocus"
            | "restoreFocus"
            | "fallbackFocus"
            | "useOverlayStack"
            | "overlayStack"
        >
    > {}

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
    update(options: AlertDialogCompositionUpdateOptions): void;
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

function getActionText(
    text: string | undefined,
    locale: AlertDialogLocalization | null,
    key: AlertDialogMessageKey
): string {
    return text ?? getLocaleText(locale, key, accessibleFirstEnglishMessages[key]);
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

function assignDialogUpdateOptions(
    target: DialogCompositionUpdateOptions,
    options: AlertDialogCompositionUpdateOptions
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
    if (options.open !== undefined) target.open = options.open;
    if (options.modal !== undefined) target.modal = options.modal;
    if (options.lockScroll !== undefined) target.lockScroll = options.lockScroll;
    if (options.closeOnEscape !== undefined) target.closeOnEscape = options.closeOnEscape;
    if (options.dismissOnPointerDownOutside !== undefined) {
        target.dismissOnPointerDownOutside = options.dismissOnPointerDownOutside;
    }
    if (options.dismissOnFocusOutside !== undefined) {
        target.dismissOnFocusOutside = options.dismissOnFocusOutside;
    }
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
    options: AlertDialogCompositionUpdateOptions,
    onOpenChange: (open: boolean) => void
): DialogCompositionUpdateOptions {
    const dialogOptions: DialogCompositionUpdateOptions = {};

    assignDialogUpdateOptions(dialogOptions, options);

    if ("onOpenChange" in options) {
        dialogOptions.onOpenChange = onOpenChange;
    }

    return dialogOptions;
}

function getCancelButtonUpdateOptions(
    options: AlertDialogCompositionUpdateOptions
): ButtonCompositionOptions {
    const buttonOptions: ButtonCompositionOptions = {};

    if (options.cancelVariant !== undefined) buttonOptions.variant = options.cancelVariant;
    if (options.cancelSize !== undefined) buttonOptions.size = options.cancelSize;
    if (options.cancelDisabled !== undefined) buttonOptions.disabled = options.cancelDisabled;

    return buttonOptions;
}

function getConfirmButtonUpdateOptions(
    options: AlertDialogCompositionUpdateOptions
): ButtonCompositionOptions {
    const buttonOptions: ButtonCompositionOptions = {};

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
    let cancelText = options.cancelText;
    let confirmText = options.confirmText;
    let locale: AlertDialogLocalization | null = options.locale ?? null;
    let unsubscribeLocale: (() => void) | null = null;

    const cancelButton = Button(getActionButtonOptions(
        getActionText(cancelText, locale, "alertDialog.cancelText"),
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
        getActionText(confirmText, locale, "alertDialog.confirmText"),
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

    function syncLocalizedText(): void {
        cancelButton.setText(getActionText(cancelText, locale, "alertDialog.cancelText"));
        confirmButton.setText(getActionText(confirmText, locale, "alertDialog.confirmText"));
    }

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        if (!locale?.subscribe) return;

        unsubscribeLocale = locale.subscribe(() => {
            syncLocalizedText();
        });
    }

    const dialog = Dialog(getDialogOptions(
        options,
        cancelButton,
        confirmButton,
        () => focusTarget,
        handleOpenChange
    ));

    syncLocaleSubscription();

    composed = {
        ...dialog,
        cancelButton: cancelButton.element,
        confirmButton: confirmButton.element,

        setCancelText(text: string): void {
            cancelText = text;
            syncLocalizedText();
        },

        setConfirmText(text: string): void {
            confirmText = text;
            syncLocalizedText();
        },

        setCancelDisabled(disabled: boolean): void {
            cancelButton.setDisabled(disabled);
        },

        setConfirmDisabled(disabled: boolean): void {
            confirmButton.setDisabled(disabled);
        },

        update(nextOptions: AlertDialogCompositionUpdateOptions): void {
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

            if ("cancelText" in nextOptions) cancelText = nextOptions.cancelText;
            if ("confirmText" in nextOptions) confirmText = nextOptions.confirmText;

            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                syncLocaleSubscription();
            }

            cancelButton.update(getCancelButtonUpdateOptions(nextOptions));
            confirmButton.update(getConfirmButtonUpdateOptions(nextOptions));
            syncLocalizedText();
            dialog.update(getDialogUpdateOptions(nextOptions, handleOpenChange));
        },

        destroy(): void {
            unsubscribeLocale?.();
            dialog.destroy();
        }
    };

    return composed;
}
