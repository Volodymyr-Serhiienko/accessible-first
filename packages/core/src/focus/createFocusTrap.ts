import { getActiveElement } from "../dom";
import { addEventListener, type Cleanup } from "../events";
import { isTabKey } from "../keyboard";
import { createFocusStack } from "./createFocusStack";
import { focusElement } from "./focusElement";
import { focusFirst } from "./focusFirst";
import { getFocusableElements } from "./getFocusableElements";

/**
 * Configuration options for initializing a focus trap behavior instance.
 */
export interface FocusTrapOptions {
    initialFocus?: HTMLElement | (() => HTMLElement | null) | null;
    fallbackFocus?: HTMLElement | (() => HTMLElement | null) | null;
    restoreFocus?: boolean;
}

/**
 * Interface representing a focus trap mechanism.
 * Constrains keyboard focus navigation within a designated DOM subtree, ensuring that 
 * hitting Tab or Shift+Tab loops focus through the subtree container elements (crucial for modal accessibility).
 */
export interface FocusTrap {
    activate(): void;
    deactivate(): void;
    pause(): void;
    resume(): void;
    isActive(): boolean;
    isPaused(): boolean;
}

function resolveElement(
    value: HTMLElement | (() => HTMLElement | null) | null | undefined
): HTMLElement | null {
    return typeof value === "function" ? value() : value ?? null;
}

/**
 * Creates a focus trap inside a container.
 * 
 * @param container - The parent HTML element that wraps all focusable elements to be trapped.
 * @param options - Configuration options for modifying initial, fallback, and restoration focus behaviors.
 * @returns An object conforming to the `FocusTrap` interface to manage the trap's lifecycle.
 */
export function createFocusTrap(
    container: HTMLElement,
    options: FocusTrapOptions = {}
): FocusTrap {
    const focusStack = createFocusStack();

    let active = false;
    let paused = false;
    let cleanupKeyDown: Cleanup | null = null;

    function focusInitialElement(): void {
        const initialFocus = resolveElement(options.initialFocus);

        if (focusElement(initialFocus)) {
            return;
        }

        if (focusFirst(container)) {
            return;
        }

        focusElement(resolveElement(options.fallbackFocus));
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (!active || paused || !isTabKey(event)) {
            return;
        }

        const elements = getFocusableElements(container);

        if (elements.length === 0) {
            const fallbackFocus = resolveElement(options.fallbackFocus);

            if (fallbackFocus) {
                event.preventDefault();
                focusElement(fallbackFocus);
            }

            return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (!first || !last) {
            return;
        }

        const current = getActiveElement(container);

        if (event.shiftKey && current === first) {
            event.preventDefault();
            focusElement(last);
            return;
        }

        if (!event.shiftKey && current === last) {
            event.preventDefault();
            focusElement(first);
        }
    }

    return {
        activate(): void {
            if (active) {
                return;
            }

            focusStack.capture(container);

            active = true;
            paused = false;

            cleanupKeyDown = addEventListener<KeyboardEvent>(
                container,
                "keydown",
                handleKeyDown
            );

            focusInitialElement();
        },

        deactivate(): void {
            if (!active) {
                return;
            }

            active = false;
            paused = false;

            cleanupKeyDown?.();
            cleanupKeyDown = null;

            if (options.restoreFocus !== false) {
                focusStack.restore();
            } else {
                focusStack.pop();
            }
        },

        pause(): void {
            if (active) {
                paused = true;
            }
        },

        resume(): void {
            if (active) {
                paused = false;
            }
        },

        isActive(): boolean {
            return active;
        },

        isPaused(): boolean {
            return paused;
        }
    };
}
