import {
    contains,
    isHTMLElement
} from "../dom";

export function containsFocus(
    container: HTMLElement
): boolean {

    const activeElement = document.activeElement;

    if (!isHTMLElement(activeElement)) {
        return false;
    }

    return contains(
        container,
        activeElement
    );

}