let counter = 0;

/**
 * Creates a unique ID.
 *
 * @param prefix Prefix used for generated IDs.
 * @returns Unique identifier.
 */
export function createId(prefix = "af"): string {
    counter++;

    return `${prefix}-${counter}`;
}
