/**
 * Returns true if the pressed key is Space.
 */
export function isSpaceKey(event: KeyboardEvent): boolean {
    return event.key === " " || event.key === "Spacebar";
}
