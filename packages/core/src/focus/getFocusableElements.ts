import { isFocusable } from "./isFocusable";

/**
 * Returns all focusable elements inside a container.
 * 
 * @param container - The parent HTML element to search for focusable descendants.
 * @returns An array of filtered, focusable HTML elements found within the container.
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
