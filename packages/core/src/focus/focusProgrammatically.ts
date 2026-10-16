import { restoreAttribute } from "../dom";
import { focusElement } from "./focusElement";

/**
 * Focuses an element even when it is not normally keyboard-focusable.
 *
 * A semantic target without tabindex keeps a temporary `tabindex="-1"`
 * until blur; removing it while focused can send focus back to the body.
 * Failed attempts clean up immediately. Existing tabindex values are preserved.
 */
export function focusProgrammatically(
    element: HTMLElement | null,
    options?: FocusOptions
): boolean {
    if (!element) return false;

    if (element.tabIndex >= 0 || element.hasAttribute("tabindex")) {
        return focusElement(element, options);
    }

    element.tabIndex = -1;
    let focused = false;
    const restore = (): void => {
        if (element.getAttribute("tabindex") === "-1") {
            restoreAttribute(element, "tabindex", null);
        }
    };

    try {
        focused = focusElement(element, options);
        if (focused) element.addEventListener("blur", restore, { once: true });
        return focused;
    } finally {
        if (!focused) restore();
    }
}
