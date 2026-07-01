import { getFocusableElements } from "../focus";

export function hasFocusableElements(
    container: HTMLElement
): boolean {

    return getFocusableElements(container).length > 0;

}