/**
 * Returns true if the pressed key is Space.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals " " or "Spacebar", otherwise false.
 */
export function isSpaceKey(event: KeyboardEvent): boolean {
    return event.key === " " || event.key === "Spacebar";
}
