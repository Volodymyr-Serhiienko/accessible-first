import { restoreAttribute } from "../../../core/src/dom";

export interface SelectedStateOptions {
    selected?: boolean;
    attribute?: string;
}

export interface SelectedState {
    setSelected(selected: boolean): void;
    isSelected(): boolean;
    toggleSelected(force?: boolean): boolean;
    destroy(): void;
}

/**
 * Stores a non-ARIA selected state for composed action components.
 * Use this for visual/action state. Use aria-pressed only for true toggle buttons.
 */
export function createSelectedState(
    element: HTMLElement,
    options: SelectedStateOptions = {}
): SelectedState {
    const attribute = options.attribute ?? "data-af-selected";
    const originalValue = element.getAttribute(attribute);

    let selected = options.selected ?? originalValue === "true";
    let destroyed = false;

    function sync(): void {
        if (selected) {
            element.setAttribute(attribute, "true");
            return;
        }

        element.removeAttribute(attribute);
    }

    sync();

    return {
        setSelected(nextSelected: boolean): void {
            if (destroyed) return;

            selected = nextSelected;
            sync();
        },

        isSelected(): boolean {
            return selected;
        },

        toggleSelected(force?: boolean): boolean {
            if (destroyed) return selected;

            selected = force ?? !selected;
            sync();

            return selected;
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            restoreAttribute(element, attribute, originalValue);
        }
    };
}
