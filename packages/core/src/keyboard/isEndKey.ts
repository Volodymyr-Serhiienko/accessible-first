/**
 * Returns true if the pressed key is End.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "End", otherwise false.
 */
export function isEndKey(event: KeyboardEvent): boolean {
    return event.key === "End";
}
