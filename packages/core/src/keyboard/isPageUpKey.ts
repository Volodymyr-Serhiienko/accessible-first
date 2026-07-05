/**
 * Returns true if the pressed key is PageUp.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "PageUp", otherwise false.
 */
export function isPageUpKey(event: KeyboardEvent): boolean {
    return event.key === "PageUp";
}
