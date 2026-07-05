/**
 * Returns true if the pressed key is Backspace.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "Backspace", otherwise false.
 */
export function isBackspaceKey(event: KeyboardEvent): boolean {
    return event.key === "Backspace";
}
