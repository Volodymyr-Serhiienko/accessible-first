import { isFocusable } from "./isFocusable";

/**
 * Returns all focusable elements inside a container.
 */
const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button",
    "input",
    "select",
    "textarea",
    "summary",
    "iframe",
    "audio[controls]",
    "video[controls]",
    "[contenteditable]:not([contenteditable='false'])",
    "[tabindex]:not([tabindex='-1'])"
].join(",");

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(isFocusable);
}
