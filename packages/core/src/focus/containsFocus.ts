export function containsFocus(
    container: HTMLElement
): boolean {

    const activeElement = document.activeElement;

    if (!(activeElement instanceof HTMLElement)) {
        return false;
    }

    return container.contains(activeElement);
}