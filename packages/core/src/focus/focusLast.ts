import { focusElement } from "./focusElement";
import { getFocusableElements } from "./getFocusableElements";

/**
 * Moves focus to the last focusable element inside a container.
 */

export function focusLast(container: HTMLElement): boolean {
    const elements = getFocusableElements(container);

    return focusElement(
        elements[elements.length - 1] ?? null
    );
}
