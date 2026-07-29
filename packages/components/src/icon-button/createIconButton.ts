import {
    setAriaAttribute,
    setAriaDisabled,
    setAriaLabelledBy,
    setRole,
    type AriaReferences
} from "../../../core/src/aria";
import { addEventListener } from "../../../core/src/events";
import { isEnterKey, isSpaceKey } from "../../../core/src/keyboard";
import { createComponentLifecycle } from "../foundation";
import type { ButtonPressedState } from "../button";
import type { IconButton, IconButtonOptions } from "./types";

function isNativeButton(element: HTMLElement): element is HTMLButtonElement {
    return element.localName === "button";
}

function hasAccessibleName(element: HTMLElement): boolean {
    return Boolean(
        element.getAttribute("aria-label")?.trim()
        || element.getAttribute("aria-labelledby")?.trim()
        || element.textContent?.trim()
        || element.getAttribute("title")?.trim()
    );
}

function restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
}

/**
 * Creates and initializes an accessible icon button component wrapper.
 * Decorates visual-only button nodes by enforcing strict fallback screen reader names 
 * (`aria-label`, `aria-labelledby`), rendering variant types (`data-af-variant`, `data-af-size`), 
 * native click interceptors, and keyboard activation bindings for non-native interactive tags.
 * Reverts all modified element markup attributes automatically upon component destruction.
 *
 * @param element - The root HTMLElement context targeted to behave as an icon button.
 * @param options - Label strings, reference links, interactive blocks, and variant configurations.
 * @returns An IconButton decorator interface exposing atomic visual/relational mutators.
 */
export function createIconButton(
    element: HTMLElement,
    options: IconButtonOptions = {}
): IconButton {
    const lifecycle = createComponentLifecycle(element, {
        name: "icon-button",
        initialState: options.disabled ? "disabled" : "ready"
    });

    const nativeButton = isNativeButton(element) ? element : null;

    const originalRole = element.getAttribute("role");
    const originalTabIndex = element.getAttribute("tabindex");
    const originalType = nativeButton?.getAttribute("type") ?? null;
    const originalDisabled = nativeButton?.disabled ?? false;
    const originalAriaLabel = element.getAttribute("aria-label");
    const originalAriaLabelledBy = element.getAttribute("aria-labelledby");
    const originalAriaPressed = element.getAttribute("aria-pressed");
    const originalAriaDisabled = element.getAttribute("aria-disabled");
    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalWarning = element.getAttribute("data-af-warning");

    let disabled = options.disabled ?? false;
    let pressed: ButtonPressedState = options.pressed ?? null;
    let onPress = options.onPress ?? null;
    let label: string | null = options.label ?? null;
    let labelledBy: AriaReferences = options.labelledBy ?? null;
    let hasExplicitLabel = options.label !== undefined;
    let hasExplicitLabelledBy = options.labelledBy !== undefined;

    function syncAccessibleName(): void {
        element.removeAttribute("data-af-warning");

        if (hasExplicitLabelledBy) {
            setAriaLabelledBy(element, labelledBy);

            if (element.getAttribute("aria-labelledby")?.trim()) {
                element.removeAttribute("aria-label");
                return;
            }
        }

        if (hasExplicitLabel) {
            if (label?.trim()) {
                element.setAttribute("aria-label", label);
                element.removeAttribute("aria-labelledby");
                return;
            }

            element.removeAttribute("aria-label");
        }

        if (!hasAccessibleName(element)) {
            element.setAttribute("aria-label", "Icon button");
            element.setAttribute("data-af-warning", "missing-accessible-name");
        }
    }

    function syncDisabled(): void {
        lifecycle.setState(disabled ? "disabled" : "ready");

        if (nativeButton) {
            nativeButton.disabled = disabled;
            return;
        }

        setAriaDisabled(element, disabled ? true : null);
        element.tabIndex = disabled ? -1 : 0;
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

    function setDisabled(nextDisabled: boolean): void {
        if (lifecycle.isDestroyed()) return;

        disabled = nextDisabled;
        syncDisabled();
    }

    function setPressed(nextPressed: ButtonPressedState): void {
        if (lifecycle.isDestroyed()) return;

        pressed = nextPressed;
        syncPressed();
    }

    function setLabel(nextLabel: string | null): void {
        if (lifecycle.isDestroyed()) return;

        label = nextLabel;
        hasExplicitLabel = true;
        syncAccessibleName();
    }

    function setLabelledBy(nextLabelledBy: AriaReferences): void {
        if (lifecycle.isDestroyed()) return;

        labelledBy = nextLabelledBy;
        hasExplicitLabelledBy = true;
        syncAccessibleName();
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

        lifecycle.addCleanup(addEventListener<KeyboardEvent>(element, "keydown", handleKeyDown));
        lifecycle.addCleanup(addEventListener<KeyboardEvent>(element, "keyup", handleKeyUp));
    }

    element.setAttribute("data-af-variant", options.variant ?? "secondary");
    element.setAttribute("data-af-size", options.size ?? "md");

    lifecycle.addCleanup(addEventListener<MouseEvent>(element, "click", handleClick));

    lifecycle.addCleanup(() => {
        restoreAttribute(element, "role", originalRole);
        restoreAttribute(element, "tabindex", originalTabIndex);
        restoreAttribute(element, "aria-label", originalAriaLabel);
        restoreAttribute(element, "aria-labelledby", originalAriaLabelledBy);
        restoreAttribute(element, "aria-pressed", originalAriaPressed);
        restoreAttribute(element, "aria-disabled", originalAriaDisabled);
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "data-af-warning", originalWarning);

        if (nativeButton) {
            restoreAttribute(nativeButton, "type", originalType);
            nativeButton.disabled = originalDisabled;
        }
    });

    syncAccessibleName();
    syncDisabled();
    syncPressed();

    return {
        element,

        setDisabled,
        isDisabled: () => disabled,

        setPressed,
        getPressed: () => pressed,

        setLabel,
        setLabelledBy,

        update(nextOptions: Partial<IconButtonOptions>): void {
            if (nextOptions.disabled !== undefined) {
                setDisabled(nextOptions.disabled);
            }

            if ("onPress" in nextOptions) {
                onPress = nextOptions.onPress ?? null;
            }

            if ("pressed" in nextOptions) {
                setPressed(nextOptions.pressed ?? null);
            }

            if ("label" in nextOptions) {
                setLabel(nextOptions.label ?? null);
            }

            if ("labelledBy" in nextOptions) {
                setLabelledBy(nextOptions.labelledBy ?? null);
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
