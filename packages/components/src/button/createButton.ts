import { setAriaAttribute, setAriaDisabled, setRole } from "../../../core/src/aria";
import { addEventListener } from "../../../core/src/events";
import { isEnterKey, isSpaceKey } from "../../../core/src/keyboard";
import { createComponentLifecycle } from "../foundation";
import type { Button, ButtonOptions, ButtonPressedState } from "./types";

function isNativeButton(element: HTMLElement): element is HTMLButtonElement {
    return element.localName === "button";
}

function restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
}

/**
 * Enhances a native button or a custom HTMLElement with accessible button behavior.
 * Native buttons keep browser semantics. Non-native elements receive role, tabindex,
 * disabled handling, and keyboard activation that routes through the normal click path.
 *
 * @param element - Native `<button>` or custom element to enhance as a button.
 * @param options - Disabled state, toggle state, visual variant, size, type, and press callback.
 * @returns A Button controller for state updates and cleanup.
 */
export function createButton(
    element: HTMLElement,
    options: ButtonOptions = {}
): Button {
    const lifecycle = createComponentLifecycle(element, {
        name: "button",
        initialState: options.disabled ? "disabled" : "ready"
    });

    const nativeButton = isNativeButton(element) ? element : null;

    const originalRole = element.getAttribute("role");
    const originalTabIndex = element.getAttribute("tabindex");
    const originalAriaDisabled = element.getAttribute("aria-disabled");
    const originalAriaPressed = element.getAttribute("aria-pressed");
    const originalType = nativeButton?.getAttribute("type") ?? null;
    const originalDisabled = nativeButton?.disabled ?? false;
    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");

    let disabled = options.disabled ?? false;
    let pressed: ButtonPressedState = options.pressed ?? null;
    let onPress = options.onPress ?? null;

    function syncDisabled(): void {
        lifecycle.setState(disabled ? "disabled" : "ready");

        if (nativeButton) {
            nativeButton.disabled = disabled;
        } else {
            setAriaDisabled(element, disabled ? true : null);
            element.tabIndex = disabled ? -1 : 0;
        }
    }

    function syncPressed(): void {
        setAriaAttribute(element, "aria-pressed", pressed);
    }

    function handleClick(event: MouseEvent): void {
        if (disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        onPress?.(event);
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (disabled) {
            return;
        }

        if (isEnterKey(event)) {
            event.preventDefault();
            element.click();
            return;
        }

        if (isSpaceKey(event)) {
            event.preventDefault();
        }
    }

    function handleKeyUp(event: KeyboardEvent): void {
        if (disabled) {
            return;
        }

        if (isSpaceKey(event)) {
            event.preventDefault();
            element.click();
        }
    }

    if (nativeButton && !nativeButton.hasAttribute("type")) {
        nativeButton.type = options.type ?? "button";
    }

    if (!nativeButton) {
        if (!element.hasAttribute("role")) {
            setRole(element, "button");
        }

        if (!element.hasAttribute("tabindex")) {
            element.tabIndex = 0;
        }

        lifecycle.addCleanup(
            addEventListener<KeyboardEvent>(element, "keydown", handleKeyDown)
        );

        lifecycle.addCleanup(
            addEventListener<KeyboardEvent>(element, "keyup", handleKeyUp)
        );
    }

    element.setAttribute("data-af-variant", options.variant ?? "primary");
    element.setAttribute("data-af-size", options.size ?? "md");

    lifecycle.addCleanup(addEventListener<MouseEvent>(element, "click", handleClick));

    lifecycle.addCleanup(() => {
        restoreAttribute(element, "role", originalRole);
        restoreAttribute(element, "tabindex", originalTabIndex);
        restoreAttribute(element, "aria-disabled", originalAriaDisabled);
        restoreAttribute(element, "aria-pressed", originalAriaPressed);
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);

        if (nativeButton) {
            restoreAttribute(nativeButton, "type", originalType);
            nativeButton.disabled = originalDisabled;
        }
    });

    syncDisabled();
    syncPressed();

    return {
        element,

        setDisabled(nextDisabled: boolean): void {
            if (lifecycle.isDestroyed()) return;

            disabled = nextDisabled;
            syncDisabled();
        },

        isDisabled(): boolean {
            return disabled;
        },

        setPressed(nextPressed: ButtonPressedState): void {
            if (lifecycle.isDestroyed()) return;

            pressed = nextPressed;
            syncPressed();
        },

        getPressed(): ButtonPressedState {
            return pressed;
        },

        update(nextOptions: Partial<ButtonOptions>): void {
            if (nextOptions.disabled !== undefined) {
                this.setDisabled(nextOptions.disabled);
            }

            if ("pressed" in nextOptions) {
                this.setPressed(nextOptions.pressed ?? null);
            }

            if ("onPress" in nextOptions) {
                onPress = nextOptions.onPress ?? null;
            }

            if (nextOptions.variant !== undefined) {
                element.setAttribute("data-af-variant", nextOptions.variant);
            }

            if (nextOptions.size !== undefined) {
                element.setAttribute("data-af-size", nextOptions.size);
            }

            if (nativeButton && nextOptions.type !== undefined) {
                nativeButton.type = nextOptions.type;
            }
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
