import { ensureId } from "../id";
import { setAriaAttribute, type AriaAttributeName } from "./setAriaAttribute";

/**
 * Represents a reference to another DOM element used in ARIA relationship attributes.
 * Can be an actual `HTMLElement`, a string representing an element's `id`, or a nullable value.
 */
export type AriaReference = HTMLElement | string | null | undefined;

/**
 * Represents a collection or a single reference to DOM elements for multi-valued ARIA relationship attributes 
 * (such as `aria-labelledby` or `aria-controls`).
 */
export type AriaReferences = AriaReference | AriaReference[];

function resolveReferenceId(reference: AriaReference, prefix: string): string | null {
    if (!reference) {
        return null;
    }

    if (typeof reference === "string") {
        return reference;
    }

    return ensureId(reference, prefix);
}

/**
 * Splits a space-separated ARIA reference attribute value into stable ids.
 */
export function splitAriaReferenceIds(value: string | null | undefined): string[] {
    return (value ?? "").split(/\s+/).filter(Boolean);
}

/**
 * Adds one id to an existing ARIA reference attribute value.
 */
export function addAriaReferenceId(value: string | null | undefined, id: string): string {
    const ids = new Set(splitAriaReferenceIds(value));
    ids.add(id);

    return Array.from(ids).join(" ");
}

/**
 * Removes one id from an existing ARIA reference attribute value.
 */
export function removeAriaReferenceId(
    value: string | null | undefined,
    id: string
): string | null {
    const nextValue = splitAriaReferenceIds(value)
        .filter((item) => item !== id)
        .join(" ");

    return nextValue || null;
}

/**
 * Reads text from elements referenced by an ARIA relationship attribute.
 */
export function getAriaReferencedText(
    element: HTMLElement,
    attribute: AriaAttributeName
): string {
    const value = element.getAttribute(attribute);

    if (!value) {
        return "";
    }

    return splitAriaReferenceIds(value)
        .map((id) => element.ownerDocument.getElementById(id)?.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ")
        .trim();
}

/**
 * Sets an ARIA attribute that references other elements (e.g., aria-labelledby, aria-controls) 
 * by combining their IDs into a space-separated string.
 *
 * @param element - The HTML element on which to set the ARIA attribute.
 * @param name - The name of the ARIA attribute.
 * @param references - A single reference or an array of references (HTMLElements or string IDs).
 * @param prefix - The prefix used for auto-generated IDs. Defaults to "af".
 */
export function setAriaReferences(
    element: HTMLElement,
    name: AriaAttributeName,
    references: AriaReferences,
    prefix = "af"
): void {
    const list = Array.isArray(references) ? references : [references];

    const value = list
        .map((reference) => resolveReferenceId(reference, prefix))
        .filter((id): id is string => Boolean(id))
        .join(" ");

    setAriaAttribute(element, name, value || null);
}
