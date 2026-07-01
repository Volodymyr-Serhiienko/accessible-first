import { getFocusableElements } from "./getFocusableElements";

export function hasFocusableElements(
    container: HTMLElement
): boolean {

    return getFocusableElements(container).length > 0;

}