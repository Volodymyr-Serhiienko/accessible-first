import {
    setAriaAttribute,
    setAriaDisabled,
    setAriaLabelledBy,
    setRole,
    type AriaReferences
} from "../../../core/src/aria";
import { addEventListener } from "../../../core/src/events";
import { isEnterKey, isSpaceKey } from "../../../core/src/keyboard";
import { restoreAttribute } from "../../../core/src/dom";
import { createComponentLifecycle } from "../foundation";
import {
    accessibleFirstEnglishMessages,
    getLocaleText
} from "../localization";
import { createLocaleSubscription } from "../localization/createLocaleSubscription";

import type { ButtonPressedState } from "../button";
import type { IconButton, IconButtonLocalization, IconButtonOptions, IconButtonUpdateOptions } from "./types";

function isNativeButton(element: HTMLElement): element is HTMLButtonElement {
    return element.localName === "button";
}

function hasAuthorAccessibleName(element: HTMLElement, fallbackLabelApplied: boolean): boolean {
    const label = element.getAttribute("aria-label")?.trim();

    return Boolean(
        element.getAttribute("aria-labelledby")?.trim()
        || (label && !fallbackLabelApplied)
        || element.textContent?.trim()
        || element.getAttribute("title")?.trim()
    );
}

function getFallbackLabel(locale: IconButtonLocalization | null): string {
    return getLocaleText(
        locale,
        "iconButton.fallbackLabel",
        accessibleFirstEnglishMessages["iconButton.fallbackLabel"]
    );
}

/**
 * Enhances an element as an accessible icon-only button.
 *
 * A meaningful `label` or `labelledBy` should be provided. When missing,
 * Accessible First applies a fallback name and marks the component for diagnostics.
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

    let disabled = options.disabled ?? (nativeButton?.disabled ?? originalAriaDisabled === "true");
    let pressed: ButtonPressedState = options.pressed !== undefined ? options.pressed
        : originalAriaPressed === "mixed" ? "mixed" : originalAriaPressed === "true" ? true
        : originalAriaPressed === "false" ? false : null;
    let spaceArmed = false;
    let onPress = options.onPress ?? null;
    let label: string | null = options.label ?? null;
    let labelledBy: AriaReferences = options.labelledBy ?? null;
    let hasExplicitLabel = options.label !== undefined;
    let hasExplicitLabelledBy = options.labelledBy !== undefined;
    let fallbackLabelApplied = false;
    let locale: IconButtonLocalization | null = options.locale ?? null;
    let nameRevision = 0;
    const localeSubscription = createLocaleSubscription(syncAccessibleName);

    function syncAccessibleName(): void {
        if (lifecycle.isDestroyed()) return;
        const current = ++nameRevision;
        element.removeAttribute("data-af-warning");

        if (hasExplicitLabelledBy) {
            setAriaLabelledBy(element, labelledBy);

            if (element.getAttribute("aria-labelledby")?.trim()) {
                element.removeAttribute("aria-label");
                fallbackLabelApplied = false;
                return;
            }
        }

        if (hasExplicitLabel) {
            if (label?.trim()) {
                element.setAttribute("aria-label", label);
                element.removeAttribute("aria-labelledby");
                fallbackLabelApplied = false;
                return;
            }

            element.removeAttribute("aria-label");
        }

        if (hasAuthorAccessibleName(element, fallbackLabelApplied)) {
            if (fallbackLabelApplied) {
                element.removeAttribute("aria-label");
                fallbackLabelApplied = false;
            }

            return;
        }

        const fallback = getFallbackLabel(locale);
        if (lifecycle.isDestroyed() || current !== nameRevision) return;
        element.setAttribute("aria-label", fallback);
        element.setAttribute("data-af-warning", "missing-accessible-name");
        fallbackLabelApplied = true;
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
        if (event.defaultPrevented) return;
        if (disabled) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }

        onPress?.(event);
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (!acceptsKey(event)) return;

        if (isEnterKey(event)) {
            event.preventDefault();
            element.click();
        }

        if (isSpaceKey(event)) {
            event.preventDefault();
            spaceArmed = true;
        }
    }

    function handleKeyUp(event: KeyboardEvent): void {
        const activate = spaceArmed && acceptsKey(event);
        spaceArmed = false;
        if (activate && isSpaceKey(event)) {
            event.preventDefault();
            element.click();
        }
    }

    function acceptsKey(event: KeyboardEvent): boolean {
        return !disabled && event.target === element && !event.defaultPrevented
            && !event.isComposing && event.keyCode !== 229
            && !event.altKey && !event.ctrlKey && !event.metaKey;
    }

    function setDisabled(nextDisabled: boolean): void {
        if (lifecycle.isDestroyed()) return;

        disabled = nextDisabled;
        spaceArmed = false;
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

    if (nativeButton) {
        if (options.type !== undefined) {
            nativeButton.type = options.type;
        } else if (!nativeButton.hasAttribute("type")) {
            nativeButton.type = "button";
        }
    }

    if (!nativeButton) {
        lifecycle.addCleanup(addEventListener(element, "blur", () => { spaceArmed = false; }));
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
    lifecycle.addCleanup(localeSubscription.destroy);

    localeSubscription.replace(locale);
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

        update(nextOptions: IconButtonUpdateOptions): void {
            if (lifecycle.isDestroyed()) return;
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

            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                localeSubscription.replace(locale);
            }

            if (lifecycle.isDestroyed()) return;

            if (nextOptions.variant !== undefined) {
                element.setAttribute("data-af-variant", nextOptions.variant);
            }

            if (nextOptions.size !== undefined) {
                element.setAttribute("data-af-size", nextOptions.size);
            }

            if (nativeButton && nextOptions.type !== undefined) {
                nativeButton.type = nextOptions.type;
            }
            syncAccessibleName();
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
