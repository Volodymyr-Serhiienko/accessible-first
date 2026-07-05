import { getFocusableElements } from "./getFocusableElements";

/**
 * Returns true if the container contains focusable elements.
 */
export function hasFocusableElements(container: HTMLElement): boolean {
    return getFocusableElements(container).length > 0;
}
