/**
 * Returns true if the pressed key is PageDown.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "PageDown", otherwise false.
 */
export function isPageDownKey(event: KeyboardEvent): boolean {
    return event.key === "PageDown";
}
