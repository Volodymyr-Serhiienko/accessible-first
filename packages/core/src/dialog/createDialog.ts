import {
    setAriaDescribedBy,
    setAriaLabelledBy,
    setAriaModal,
    setRole
} from "../aria";
import { addEventListener, type Cleanup } from "../events";
import {
    createFocusTrap,
    focusElement,
    focusFirst,
    type FocusTrapOptions
} from "../focus";
import { isEscapeKey } from "../keyboard";
import type { Dialog, DialogElement, DialogOptions } from "./types";

function resolveElement(value: DialogElement | undefined): HTMLElement | null {
    return typeof value === "function" ? value() : value ?? null;
}

function restoreAttribute(
    element: HTMLElement,
    name: string,
    value: string | null
): void {
    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
}

function getFocusTrapOptions(
    dialog: HTMLElement,
    options: DialogOptions
): FocusTrapOptions {
    const focusTrapOptions: FocusTrapOptions = {
        fallbackFocus: options.fallbackFocus ?? dialog
    };

    if (options.initialFocus !== undefined) {
        focusTrapOptions.initialFocus = options.initialFocus;
    }

    if (options.restoreFocus !== undefined) {
        focusTrapOptions.restoreFocus = options.restoreFocus;
    }

    return focusTrapOptions;
}

/**
 * Creates and manages an accessible modal or non-modal dialog component.
 * Configures required ARIA attributes, wires keyboard behavior (such as closing via Escape), 
 * orchestrates focus containment and initial placement using an internal focus trap, 
 * and reverts changes to return the container element to its initial DOM state upon destruction.
 *
 * @param element - The main wrapper HTMLElement that functions as the dialog overlay content.
 * @param options - Configuration behavior adjustments for lifecycle management and accessibility mapping. Defaults to an empty object.
 * @returns A Dialog instance exposing control methods over visibility and cleanup routines.
 */
export function createDialog(
    element: HTMLElement,
    options: DialogOptions = {}
): Dialog {
    const originalRole = element.getAttribute("role");
    const originalAriaModal = element.getAttribute("aria-modal");
    const originalAriaLabelledBy = element.getAttribute("aria-labelledby");
    const originalAriaDescribedBy = element.getAttribute("aria-describedby");
    const originalTabIndex = element.getAttribute("tabindex");
    const originalHidden = element.hidden;

    const modal = options.modal ?? true;
    const trapFocus = options.trapFocus ?? modal;
    const closeOnEscape = options.closeOnEscape ?? true;

    const focusTrap = createFocusTrap(
        element,
        getFocusTrapOptions(element, options)
    );

    let open = options.defaultOpen ?? !element.hidden;
    let destroyed = false;

    function focusInitialElement(): void {
        if (focusElement(resolveElement(options.initialFocus))) {
            return;
        }

        if (focusFirst(element)) {
            return;
        }

        focusElement(resolveElement(options.fallbackFocus) ?? element);
    }

    function syncState(): void {
        if (open) {
            element.hidden = false;

            if (trapFocus) {
                focusTrap.activate();
            } else {
                focusInitialElement();
            }

            return;
        }

        if (focusTrap.isActive()) {
            focusTrap.deactivate();
        }

        element.hidden = true;
    }

    function setOpen(nextOpen: boolean): void {
        if (destroyed || open === nextOpen) {
            return;
        }

        open = nextOpen;
        syncState();
        options.onOpenChange?.(open);
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (!open || !closeOnEscape || !isEscapeKey(event)) {
            return;
        }

        event.preventDefault();
        setOpen(false);
    }

    const cleanups: Cleanup[] = [
        addEventListener<KeyboardEvent>(element, "keydown", handleKeyDown)
    ];

    setRole(element, options.role ?? "dialog");
    setAriaModal(element, modal ? true : null);

    if (options.labelledBy !== undefined) {
        setAriaLabelledBy(element, options.labelledBy);
    }

    if (options.describedBy !== undefined) {
        setAriaDescribedBy(element, options.describedBy);
    }

    if (!element.hasAttribute("tabindex")) {
        element.tabIndex = -1;
    }

    syncState();

    return {
        element,

        open(): void {
            setOpen(true);
        },

        close(): void {
            setOpen(false);
        },

        toggle(): void {
            setOpen(!open);
        },

        setOpen,

        isOpen(): boolean {
            return open;
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;

            for (const cleanup of cleanups) {
                cleanup();
            }

            if (focusTrap.isActive()) {
                focusTrap.deactivate();
            }

            restoreAttribute(element, "role", originalRole);
            restoreAttribute(element, "aria-modal", originalAriaModal);
            restoreAttribute(element, "aria-labelledby", originalAriaLabelledBy);
            restoreAttribute(element, "aria-describedby", originalAriaDescribedBy);
            restoreAttribute(element, "tabindex", originalTabIndex);

            element.hidden = originalHidden;
        }
    };
}
