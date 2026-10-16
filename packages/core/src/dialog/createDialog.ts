import {
    setAriaDescribedBy,
    setAriaLabelledBy,
    setAriaModal,
    setRole
} from "../aria";
import { addEventListener, runCleanups, type Cleanup } from "../events";
import {
    createFocusStack,
    createFocusTrap,
    focusElement,
    focusFirst,
    type FocusTrapOptions
} from "../focus";
import { isEscapeKey } from "../keyboard";
import { getActiveElement, restoreAttribute } from "../dom";

import type { Dialog, DialogElement, DialogOptions } from "./types";

function resolveElement(value: DialogElement | undefined): HTMLElement | null {
    return typeof value === "function" ? value() : value ?? null;
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
 * Creates accessible dialog behavior for an existing element.
 *
 * The behavior manages ARIA attributes, hidden state, Escape handling,
 * focus trapping, initial focus, focus restoration, and cleanup.
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
    const untrappedFocus = createFocusStack();

    let open = options.defaultOpen ?? !element.hidden;
    let destroyed = false;
    let revision = 0;

    function restoreUntrappedFocus(): void {
        const previous = untrappedFocus.pop();
        const active = getActiveElement(element);
        if (options.restoreFocus !== false && active && element.contains(active)) {
            focusElement(previous);
        }
    }

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
                untrappedFocus.capture(element);
                focusInitialElement();
            }

            return;
        }

        if (focusTrap.isActive()) {
            focusTrap.deactivate();
        } else {
            restoreUntrappedFocus();
        }

        if (!destroyed && !open) element.hidden = true;
    }

    function setOpen(nextOpen: boolean): void {
        if (destroyed || open === nextOpen) {
            return;
        }

        open = nextOpen;
        const currentRevision = ++revision;
        syncState();
        if (destroyed || revision !== currentRevision) return;
        options.onOpenChange?.(open);
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (!open || !closeOnEscape || event.defaultPrevented || event.isComposing
            || event.ctrlKey || event.altKey || event.metaKey || !isEscapeKey(event)) {
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

            runCleanups([
                ...cleanups,
                () => {
                    if (focusTrap.isActive()) focusTrap.deactivate();
                    else restoreUntrappedFocus();
                },
                () => {
                    untrappedFocus.clear();
                    restoreAttribute(element, "role", originalRole);
                    restoreAttribute(element, "aria-modal", originalAriaModal);
                    restoreAttribute(element, "aria-labelledby", originalAriaLabelledBy);
                    restoreAttribute(element, "aria-describedby", originalAriaDescribedBy);
                    restoreAttribute(element, "tabindex", originalTabIndex);
                    element.hidden = originalHidden;
                }
            ]);
        }
    };
}
