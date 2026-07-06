import {
    isDisabled,
    isInert,
    isVisible
} from "../dom";

/**
 * Checks if a specific HTMLElement is disabled or unavailable for roving focus navigation.
 * Evaluates standard disabled states, inertness, visibility, and ARIA disabled attributes.
 *
 * @param item - The HTML element to evaluate.
 * @returns True if the item is disabled, inert, hidden, or marked as aria-disabled; otherwise false.
 */
export function isRovingFocusItemDisabled(item: HTMLElement): boolean {
    if (isDisabled(item)) {
        return true;
    }

    if (isInert(item)) {
        return true;
    }

    if (!isVisible(item)) {
        return true;
    }

    return item.getAttribute("aria-disabled") === "true";
}
