/**
 * Returns true if the pressed key is Tab.
 * 
 * @param event - The keyboard event object from the key press.
 * @returns True if the `key` property equals "Tab", otherwise false.
 */
export function isTabKey(event: KeyboardEvent): boolean {
    return event.key === "Tab";
}
