import { P } from "./af";

/**
 * Global paragraph node instance configured with live region accessibility attributes 
 * to broadcast dynamic status messages to screen readers.
 */
export const status = P({
    id: "status",
    className: "status",
    text: "Ready for component checks.",
    attributes: {
        role: "status",
        "aria-live": "polite"
    }
});

/**
 * Updates the text content of the global status element, triggering polite notifications 
 * for assistive technologies.
 * 
 * @param message - The text string to announce to screen readers.
 */
export function announce(message: string): void {
    status.element.textContent = message;
}
