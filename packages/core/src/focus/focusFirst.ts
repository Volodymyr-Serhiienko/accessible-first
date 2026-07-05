import { focusElement } from "./focusElement";
import { getFocusableElements } from "./getFocusableElements";

/**
 * Moves focus to the first focusable element inside a container.
 */
export function focusFirst(container: HTMLElement): boolean {
    const first = getFocusableElements(container)[0];

    return focusElement(first ?? null);
}
