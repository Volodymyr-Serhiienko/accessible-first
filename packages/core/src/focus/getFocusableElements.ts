import { isFocusable } from "../focus";
/**
 * Returns all focusable elements inside a container.
 */
export function getFocusableElements(
    container: HTMLElement
): HTMLElement[] {

    const selector = [
        "a[href]",
        "button",
        "input",
        "select",
        "textarea",
        "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    return Array.from(
        container.querySelectorAll<HTMLElement>(selector)
    ).filter(isFocusable);
}