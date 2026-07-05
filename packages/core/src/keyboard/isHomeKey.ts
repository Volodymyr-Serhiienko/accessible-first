/**
 * Returns true if the pressed key is Home.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "Home", otherwise false.
 */
export function isHomeKey(event: KeyboardEvent): boolean {
    return event.key === "Home";
}
