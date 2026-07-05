/**
 * Returns true if the pressed key is Escape.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "Escape", otherwise false.
 */
export function isEscapeKey(event: KeyboardEvent): boolean {
    return event.key === "Escape";
}
