import { restoreAttribute } from "../dom";
import { focusElement } from "./focusElement";

/**
 * Focuses an element even when it is not normally keyboard-focusable.
 *
 * The helper temporarily applies `tabindex="-1"` when needed, focuses the
 * element, and restores the previous tabindex immediately after that. This
 * keeps semantic targets out of the regular Tab order while still allowing
 * route changes, skip links, screens, and dialogs to move focus predictably.
 */
export function focusProgrammatically(
    element: HTMLElement | null,
    options?: FocusOptions
): boolean {
    if (!element) return false;

    const previousTabIndex = element.getAttribute("tabindex");

    if (element.tabIndex < 0) {
        element.tabIndex = -1;
    }

    const focused = focusElement(element, options);

    restoreAttribute(element, "tabindex", previousTabIndex);

    return focused;
}
