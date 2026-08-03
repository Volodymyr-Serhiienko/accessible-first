import {
    Button,
    type ButtonCompositionOptions,
    type ButtonSize,
    type ButtonVariant,
    type ComposedButton
} from "../button";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionChild,
    type CompositionContent
} from "../composition";
import { createDialog } from "./createDialog";
import { createId } from "../../../core/src/id";
import type {
    Dialog as DialogInstance,
    DialogOptions
} from "./types";

export type DialogDescriptionMode = "content" | "aria";

export type DialogInitialFocusTarget = "first" | "title" | "description" | "dialog";

/**
 * Content accepted by dialog trigger and actions slots.
 */
export type DialogCompositionContent = CompositionContent;

/**
 * Called when a composed dialog opens or closes.
 */
export type DialogCompositionOnOpenChange = (
    open: boolean,
    dialog: ComposedDialog
) => void;

/**
 * Options for Dialog().
 */
export interface DialogCompositionOptions
    extends Omit<
            DialogOptions,
            "trigger" | "closeElements" | "surface" | "labelledBy" | "describedBy" | "onOpenChange"
        >,
        BaseCompositionOptions {
    trigger: DialogCompositionContent;
    title: string;
    titleId?: string;
    description?: string | null;
    descriptionId?: string;
    descriptionMode?: DialogDescriptionMode;
    initialFocusTarget?: DialogInitialFocusTarget;
    children?: CompositionChild[];
    actions?: DialogCompositionContent | null;
    closeText?: string;
    hideCloseButton?: boolean;
    triggerVariant?: ButtonVariant;
    triggerSize?: ButtonSize;
    onOpenChange?: DialogCompositionOnOpenChange | null;
}

/**
 * Dialog created by the composition API.
 */
export interface ComposedDialog
    extends Omit<DialogInstance, "element" | "trigger" | "surface" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly dialogElement: HTMLElement;
    readonly surface: HTMLElement;
    readonly trigger: HTMLButtonElement;
    readonly closeButton: HTMLButtonElement;
    setTitle(title: string): void;
    setDescription(description: string | null): void;
    setContent(children: CompositionChild[]): void;
    setActions(actions: DialogCompositionContent | null): void;
    update(options: Partial<DialogCompositionOptions>): void;
    destroy(): void;
}

function hasDescription(value: string | null | undefined): value is string {
    return Boolean(value?.trim());
}

function shouldUseAriaDescription(
    mode: DialogDescriptionMode,
    description: string | null | undefined
): boolean {
    return mode === "aria" && hasDescription(description);
}

function getCompositionInitialFocus(
    target: DialogInitialFocusTarget | undefined,
    dialogElement: HTMLElement,
    title: HTMLElement,
    description: HTMLElement
): DialogOptions["initialFocus"] | undefined {
    switch (target ?? "first") {
        case "dialog":
            return dialogElement;

        case "title":
            return title;

        case "description":
            return () => hasDescription(description.textContent) ? description : title;

        case "first":
        default:
            return undefined;
    }
}

function getDialogOptions(
    options: DialogCompositionOptions,
    dialogElement: HTMLElement,
    surface: HTMLElement,
    trigger: HTMLElement,
    closeButton: HTMLElement | null,
    title: HTMLElement,
    description: HTMLElement,
    onOpenChange: (open: boolean) => void
): DialogOptions {
    const descriptionMode = options.descriptionMode ?? "aria";
    const initialFocus = options.initialFocus !== undefined
        ? options.initialFocus
        : getCompositionInitialFocus(
            options.initialFocusTarget,
            dialogElement,
            title,
            description
        );

    const dialogOptions: DialogOptions = {
        trigger,
        closeElements: closeButton ? [closeButton] : [],
        surface,
        labelledBy: title,
        fallbackFocus: dialogElement,
        onOpenChange
    };

    if (shouldUseAriaDescription(descriptionMode, options.description)) {
        dialogOptions.describedBy = description;
    }

    if (initialFocus !== undefined) {
        dialogOptions.initialFocus = initialFocus;
    }

    if (options.defaultOpen !== undefined) dialogOptions.defaultOpen = options.defaultOpen;
    if (options.open !== undefined) dialogOptions.open = options.open;
    if (options.modal !== undefined) dialogOptions.modal = options.modal;
    if (options.trapFocus !== undefined) dialogOptions.trapFocus = options.trapFocus;
    if (options.closeOnEscape !== undefined) dialogOptions.closeOnEscape = options.closeOnEscape;
    if (options.restoreFocus !== undefined) dialogOptions.restoreFocus = options.restoreFocus;
    if (options.role !== undefined) dialogOptions.role = options.role;
    if (options.dismissOnPointerDownOutside !== undefined) {
        dialogOptions.dismissOnPointerDownOutside = options.dismissOnPointerDownOutside;
    }
    if (options.dismissOnFocusOutside !== undefined) {
        dialogOptions.dismissOnFocusOutside = options.dismissOnFocusOutside;
    }
    if (options.useOverlayStack !== undefined) dialogOptions.useOverlayStack = options.useOverlayStack;
    if (options.overlayStack !== undefined) dialogOptions.overlayStack = options.overlayStack;
    if (options.variant !== undefined) dialogOptions.variant = options.variant;
    if (options.size !== undefined) dialogOptions.size = options.size;
    if (options.onEscapeKeyDown !== undefined) dialogOptions.onEscapeKeyDown = options.onEscapeKeyDown;
    if (options.onPointerDownOutside !== undefined) {
        dialogOptions.onPointerDownOutside = options.onPointerDownOutside;
    }
    if (options.onFocusOutside !== undefined) dialogOptions.onFocusOutside = options.onFocusOutside;

    dialogElement.hidden = !(options.open ?? options.defaultOpen ?? false);

    return dialogOptions;
}

function getTriggerButtonOptions(
    options: DialogCompositionOptions
): ButtonCompositionOptions {
    const buttonOptions: ButtonCompositionOptions = {
        children: toCompositionChildren(options.trigger),
        variant: options.triggerVariant ?? "primary"
    };

    if (options.triggerSize !== undefined) {
        buttonOptions.size = options.triggerSize;
    }

    return buttonOptions;
}

function getTriggerButtonUpdateOptions(
    options: Partial<DialogCompositionOptions>
): ButtonCompositionOptions {
    const buttonOptions: ButtonCompositionOptions = {};

    if (options.trigger !== undefined) {
        buttonOptions.children = toCompositionChildren(options.trigger);
    }

    if (options.triggerVariant !== undefined) {
        buttonOptions.variant = options.triggerVariant;
    }

    if (options.triggerSize !== undefined) {
        buttonOptions.size = options.triggerSize;
    }

    return buttonOptions;
}

function getDialogUpdateOptions(
    options: Partial<DialogCompositionOptions>,
    description: HTMLElement,
    descriptionMode: DialogDescriptionMode,
    onOpenChange: (open: boolean) => void
): Partial<DialogOptions> {
    const dialogOptions: Partial<DialogOptions> = {};

    if ("onOpenChange" in options) {
        dialogOptions.onOpenChange = onOpenChange;
    }

    if ("description" in options || "descriptionMode" in options) {
        dialogOptions.describedBy = shouldUseAriaDescription(
            descriptionMode,
            description.textContent
        )
            ? description
            : null;
    }

    if ("onEscapeKeyDown" in options) {
        dialogOptions.onEscapeKeyDown = options.onEscapeKeyDown ?? null;
    }

    if ("onPointerDownOutside" in options) {
        dialogOptions.onPointerDownOutside = options.onPointerDownOutside ?? null;
    }

    if ("onFocusOutside" in options) {
        dialogOptions.onFocusOutside = options.onFocusOutside ?? null;
    }

    if (options.open !== undefined) dialogOptions.open = options.open;
    if (options.closeOnEscape !== undefined) dialogOptions.closeOnEscape = options.closeOnEscape;
    if (options.dismissOnPointerDownOutside !== undefined) {
        dialogOptions.dismissOnPointerDownOutside = options.dismissOnPointerDownOutside;
    }
    if (options.dismissOnFocusOutside !== undefined) {
        dialogOptions.dismissOnFocusOutside = options.dismissOnFocusOutside;
    }
    if (options.variant !== undefined) dialogOptions.variant = options.variant;
    if (options.size !== undefined) dialogOptions.size = options.size;
    if (options.role !== undefined) dialogOptions.role = options.role;
    if (options.modal !== undefined) dialogOptions.modal = options.modal;

    return dialogOptions;
}

/**
 * Creates an accessible dialog with a trigger button, title, content, actions, and close behavior.
 */
export function Dialog(options: DialogCompositionOptions): ComposedDialog {
    const element = createElement("div", {
        attributes: {
            "data-af-composition": "dialog"
        }
    });

    const triggerButton = Button(getTriggerButtonOptions(options));

    const dialogElement = createElement("div", getCompositionElementOptions(options));
    const surface = createElement("div", {
        attributes: {
            "data-af-dialog-surface": ""
        }
    });

    const header = createElement("div", {
        attributes: {
            "data-af-dialog-header": ""
        }
    });

    const title = createElement("h2", {
        id: options.titleId ?? createId("af-dialog-title"),
        text: options.title,
        attributes: {
            "data-af-dialog-title": "",
            tabindex: -1
        }
    });

    const description = createElement("p", {
        id: options.descriptionId ?? createId("af-dialog-description"),
        text: options.description ?? "",
        attributes: {
            "data-af-dialog-description": "",
            tabindex: -1
        }
    });

    description.hidden = !hasDescription(options.description);

    const body = createElement("div", {
        attributes: {
            "data-af-dialog-body": ""
        }
    });

    const footer = createElement("div", {
        attributes: {
            "data-af-dialog-actions": ""
        }
    });

    const actionsContent = createElement("div", {
        attributes: {
            "data-af-dialog-actions-content": ""
        }
    });

    const closeButton: ComposedButton = Button({
        text: options.closeText ?? "Close",
        variant: "secondary"
    });

    let hideCloseButton = options.hideCloseButton ?? false;
    let descriptionMode: DialogDescriptionMode = options.descriptionMode ?? "aria";

    const bodySlot = createContentSlot(body, options.children ?? []);
    const actionsSlot = createContentSlot(actionsContent, toCompositionChildren(options.actions));

    let composed!: ComposedDialog;
    let onOpenChange = options.onOpenChange ?? null;

    const handleOpenChange = (open: boolean): void => {
        onOpenChange?.(open, composed);
    };

    header.append(title);

    footer.append(actionsContent);

    if (!hideCloseButton) {
        footer.append(closeButton.element);
    }

    surface.append(header, description, body, footer);
    dialogElement.append(surface);
    element.append(triggerButton.element, dialogElement);

    const dialog = createDialog(
        dialogElement,
        getDialogOptions(
            options,
            dialogElement,
            surface,
            triggerButton.element,
            hideCloseButton ? null : closeButton.element,
            title,
            description,
            handleOpenChange
        )
    );

    function setTitle(nextTitle: string): void {
        title.textContent = nextTitle;
    }

    function setDescription(nextDescription: string | null): void {
        const text = nextDescription?.trim() ?? "";

        description.textContent = text;
        description.hidden = !text;
    }

    function setContent(children: CompositionChild[]): void {
        bodySlot.set(children);
    }

    function setActions(actions: DialogCompositionContent | null): void {
        actionsSlot.set(toCompositionChildren(actions));
    }

    function syncCloseButtonVisibility(): void {
        if (hideCloseButton) {
            closeButton.element.remove();
            dialog.update({ closeElements: [] });
            return;
        }

        if (closeButton.element.parentElement !== footer) {
            footer.append(closeButton.element);
        }

        dialog.update({ closeElements: [closeButton.element] });
    }

    composed = {
        ...dialog,
        element,
        dialogElement,
        surface,
        trigger: triggerButton.element,
        closeButton: closeButton.element,
        setTitle,
        setDescription,
        setContent,
        setActions,

        update(nextOptions): void {
            applyCompositionElementOptions(dialogElement, nextOptions);

            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if (nextOptions.title !== undefined) {
                setTitle(nextOptions.title);
            }

            if ("description" in nextOptions) {
                setDescription(nextOptions.description ?? null);
            }

            if (nextOptions.children !== undefined) {
                setContent(nextOptions.children);
            }

            if ("actions" in nextOptions) {
                setActions(nextOptions.actions ?? null);
            }

            if (nextOptions.closeText !== undefined) {
                closeButton.setText(nextOptions.closeText);
            }

            if (nextOptions.hideCloseButton !== undefined) {
                hideCloseButton = nextOptions.hideCloseButton;
                syncCloseButtonVisibility();
            }

            if (
                nextOptions.trigger !== undefined
                || nextOptions.triggerVariant !== undefined
                || nextOptions.triggerSize !== undefined
            ) {
                triggerButton.update(getTriggerButtonUpdateOptions(nextOptions));
            }

            if (nextOptions.descriptionMode !== undefined) {
                descriptionMode = nextOptions.descriptionMode;
            }

            dialog.update(getDialogUpdateOptions(
                nextOptions,
                description,
                descriptionMode,
                handleOpenChange
            ));
        },

        destroy(): void {
            dialog.destroy();
            bodySlot.dispose();
            actionsSlot.dispose();
            triggerButton.destroy();
            closeButton.destroy();
        }
    };

    return composed;
}
