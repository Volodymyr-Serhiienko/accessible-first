/**
 * Returns true if the pressed key is Enter.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "Enter", otherwise false.
 */
export function isEnterKey(event: KeyboardEvent): boolean {
    return event.key === "Enter";
}
