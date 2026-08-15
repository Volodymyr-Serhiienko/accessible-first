import { getOwnerDocument, isHTMLElement } from "../dom";

/**
 * Target used to find the currently active editable element.
 */
export type DismissVirtualKeyboardTarget =
    | Node
    | Document
    | ShadowRoot
    | null
    | undefined;

const textInputTypes = new Set([
    "email",
    "number",
    "password",
    "search",
    "tel",
    "text",
    "url"
]);

function isActiveElementRoot(value: DismissVirtualKeyboardTarget): value is Document | ShadowRoot {
    return Boolean(value && typeof value === "object" && "activeElement" in value);
}

function getActiveElementRoot(target: DismissVirtualKeyboardTarget): Document | ShadowRoot | null {
    if (isActiveElementRoot(target)) return target;
    if (target instanceof Node) return getOwnerDocument(target);

    return typeof document === "undefined" ? null : document;
}

function isTextInput(element: HTMLElement): element is HTMLInputElement {
    const ownerWindow = element.ownerDocument.defaultView ?? window;

    if (!(element instanceof ownerWindow.HTMLInputElement)) {
        return false;
    }

    return textInputTypes.has(element.type || "text");
}

function isTextArea(element: HTMLElement): element is HTMLTextAreaElement {
    const ownerWindow = element.ownerDocument.defaultView ?? window;

    return element instanceof ownerWindow.HTMLTextAreaElement;
}

/**
 * Returns true when an element can keep the mobile virtual keyboard open.
 */
export function isVirtualKeyboardElement(element: Element | null): element is HTMLElement {
    if (!isHTMLElement(element)) return false;

    if (isTextInput(element)) {
        return !element.disabled && !element.readOnly;
    }

    if (isTextArea(element)) {
        return !element.disabled && !element.readOnly;
    }

    return element.isContentEditable;
}

/**
 * Returns the active editable element that may keep the virtual keyboard open.
 */
export function getActiveVirtualKeyboardElement(
    target: DismissVirtualKeyboardTarget = null
): HTMLElement | null {
    const root = getActiveElementRoot(target);

    if (!root) return null;

    const activeElement = root.activeElement;

    if (isVirtualKeyboardElement(activeElement)) {
        return activeElement;
    }

    if (isHTMLElement(activeElement) && activeElement.shadowRoot) {
        return getActiveVirtualKeyboardElement(activeElement.shadowRoot);
    }

    return null;
}

/**
 * Blurs the active editable element so mobile browsers can hide the virtual keyboard.
 */
export function dismissVirtualKeyboard(
    target: DismissVirtualKeyboardTarget = null
): boolean {
    const activeElement = getActiveVirtualKeyboardElement(target);

    if (!activeElement) return false;

    activeElement.blur();
    return true;
}
