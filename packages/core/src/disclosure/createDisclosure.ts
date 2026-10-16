import {
    setAriaControls,
    setAriaDisabled,
    setAriaExpanded,
    setRole
} from "../aria";
import { addEventListener, runCleanups, type Cleanup } from "../events";
import { isEnterKey, isSpaceKey } from "../keyboard";
import { restoreAttribute } from "../dom";
import { focusElement } from "../focus";

import type { Disclosure, DisclosureOptions } from "./types";

function isButtonElement(element: HTMLElement): element is HTMLButtonElement {
    return element.localName === "button";
}

/**
 * Connects a disclosure trigger with a panel and keeps their accessible state in sync.
 * Native button triggers keep browser behavior. Non-native triggers receive fallback
 * button semantics and keyboard activation through the normal click path.
 *
 * @param trigger - Interactive element that controls the panel.
 * @param panel - Content element hidden when the disclosure is closed.
 * @param options - Initial open/disabled state and open-change callback.
 * @returns A Disclosure controller for state updates and cleanup.
 */
export function createDisclosure(
    trigger: HTMLElement,
    panel: HTMLElement,
    options: DisclosureOptions = {}
): Disclosure {
    const nativeButton = isButtonElement(trigger) ? trigger : null;

    const originalAriaControls = trigger.getAttribute("aria-controls");
    const originalAriaDisabled = trigger.getAttribute("aria-disabled");
    const originalAriaExpanded = trigger.getAttribute("aria-expanded");
    const originalRole = trigger.getAttribute("role");
    const originalTabIndex = trigger.getAttribute("tabindex");
    const originalType = nativeButton?.getAttribute("type") ?? null;
    const originalButtonDisabled = nativeButton?.disabled ?? false;
    const originalPanelHidden = panel.getAttribute("hidden");

    let open = options.defaultOpen ?? !panel.hidden;
    let disabled = options.disabled ?? (originalButtonDisabled || originalAriaDisabled === "true");
    let destroyed = false;
    let revision = 0;

    function syncState(): void {
        setAriaExpanded(trigger, open);
        setAriaDisabled(trigger, disabled ? true : null);

        panel.hidden = !open;

        if (nativeButton) {
            nativeButton.disabled = disabled;
        }
    }

    function setOpen(nextOpen: boolean): void {
        if (destroyed || open === nextOpen) {
            return;
        }

        open = nextOpen;
        const current = ++revision;
        const focused = panel.ownerDocument.activeElement;
        syncState();
        if (!open && focused && panel.contains(focused)) focusElement(trigger);
        if (!destroyed && current === revision) options.onOpenChange?.(open);
    }

    function handleClick(event: MouseEvent): void {
        if (destroyed || event.defaultPrevented) return;
        if (disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        setOpen(!open);
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (destroyed || disabled || event.target !== trigger || event.defaultPrevented || event.isComposing || event.keyCode === 229
            || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (isEnterKey(event)) {
            event.preventDefault();
            trigger.click();
            return;
        }

        if (isSpaceKey(event)) {
            event.preventDefault();
        }
    }

    function handleKeyUp(event: KeyboardEvent): void {
        if (destroyed || disabled || event.target !== trigger || event.defaultPrevented || event.isComposing || event.keyCode === 229
            || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (isSpaceKey(event)) {
            event.preventDefault();
            trigger.click();
        }
    }

    const cleanups: Cleanup[] = [
        addEventListener<MouseEvent>(trigger, "click", handleClick)
    ];

    setAriaControls(trigger, panel);

    if (nativeButton) {
        if (!nativeButton.hasAttribute("type")) {
            nativeButton.setAttribute("type", "button");
        }
    } else {
        if (!trigger.hasAttribute("role")) {
            setRole(trigger, "button");
        }

        if (!trigger.hasAttribute("tabindex")) {
            trigger.tabIndex = 0;
        }

        cleanups.push(
            addEventListener<KeyboardEvent>(trigger, "keydown", handleKeyDown),
            addEventListener<KeyboardEvent>(trigger, "keyup", handleKeyUp)
        );
    }

    syncState();

    return {
        trigger,
        panel,

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

        setDisabled(nextDisabled: boolean): void {
            if (destroyed || disabled === nextDisabled) {
                return;
            }

            disabled = nextDisabled;
            syncState();
        },

        isDisabled(): boolean {
            return disabled;
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;

            revision += 1;
            runCleanups([...cleanups, () => {
                restoreAttribute(trigger, "aria-controls", originalAriaControls);
                restoreAttribute(trigger, "aria-disabled", originalAriaDisabled);
                restoreAttribute(trigger, "aria-expanded", originalAriaExpanded);
                restoreAttribute(trigger, "role", originalRole);
                restoreAttribute(trigger, "tabindex", originalTabIndex);

                if (nativeButton) {
                    restoreAttribute(nativeButton, "type", originalType);
                    nativeButton.disabled = originalButtonDisabled;
                }

                restoreAttribute(panel, "hidden", originalPanelHidden);
            }]);
        }
    };
}
