/**
 * Returns true if the pressed key is ArrowLeft.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "ArrowLeft", otherwise false.
 */
export function isArrowLeftKey(event: KeyboardEvent): boolean {
    return event.key === "ArrowLeft";
}
