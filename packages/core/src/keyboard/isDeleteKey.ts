/**
 * Returns true if the pressed key is Delete.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "Delete", otherwise false.
 */
export function isDeleteKey(event: KeyboardEvent): boolean {
    return event.key === "Delete";
}
