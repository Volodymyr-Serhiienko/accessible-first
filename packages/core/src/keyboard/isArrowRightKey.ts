/**
 * Returns true if the pressed key is ArrowRight.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "ArrowRight", otherwise false.
 */
export function isArrowRightKey(event: KeyboardEvent): boolean {
    return event.key === "ArrowRight";
}
