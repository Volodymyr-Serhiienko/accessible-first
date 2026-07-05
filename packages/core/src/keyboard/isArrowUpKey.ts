/**
 * Returns true if the pressed key is ArrowUp.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "ArrowUp", otherwise false.
 */
export function isArrowUpKey(event: KeyboardEvent): boolean {
    return event.key === "ArrowUp";
}
