import { getActiveElement } from "../dom";
import { isFocusable } from "./isFocusable";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button",
    "input",
    "select",
    "textarea",
    "summary",
    "iframe",
    "audio[controls]",
    "video[controls]",
    "[contenteditable]:not([contenteditable='false'])",
    "[tabindex]:not([tabindex='-1'])"
].join(",");

function getNamedRadio(element: HTMLElement): HTMLInputElement | null {
    if (element.localName !== "input") return null;
    const input = element as HTMLInputElement;
    return input.type === "radio" && input.name !== "" ? input : null;
}

/**
 * Returns light-DOM sequential-focus stops, sorted by positive tabindex then DOM
 * order. Named native radios share one stop per form/root; backward discovery
 * selects the last candidate of an unchecked, unfocused group.
 */
export function getFocusableElements(container: HTMLElement, backward = false): HTMLElement[] {
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(isFocusable).sort((first, second) => {
        const firstOrder = first.tabIndex > 0 ? first.tabIndex : Infinity;
        const secondOrder = second.tabIndex > 0 ? second.tabIndex : Infinity;
        return firstOrder === secondOrder ? 0 : firstOrder - secondOrder;
    });

    const groups = new Map<HTMLFormElement | null, Map<string, HTMLInputElement | null>>();
    for (const element of elements) {
        const radio = getNamedRadio(element);
        if (!radio) continue;
        let names = groups.get(radio.form);
        if (!names) groups.set(radio.form, names = new Map());
        names.set(radio.name, null);
    }
    if (groups.size === 0) return elements;

    // A checked group member may be outside this container, including form= links.
    const root = container.getRootNode() as ParentNode;
    for (const radio of root.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
        const names = groups.get(radio.form);
        if (names?.has(radio.name) && radio.checked && isFocusable(radio)) {
            names.set(radio.name, radio);
        }
    }
    const active = getActiveElement(container);
    for (const element of backward ? [...elements].reverse() : elements) {
        const radio = getNamedRadio(element);
        if (!radio) continue;
        const names = groups.get(radio.form)!;
        if (!names.get(radio.name) || radio === active) names.set(radio.name, radio);
    }
    return elements.filter((element) => {
        const radio = getNamedRadio(element);
        return !radio || groups.get(radio.form)?.get(radio.name) === radio;
    });
}
