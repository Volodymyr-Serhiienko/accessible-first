/**
 * Returns true if the pressed key is ArrowDown.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "ArrowDown", otherwise false.
 */
export function isArrowDownKey(event: KeyboardEvent): boolean {
    return event.key === "ArrowDown";
}
