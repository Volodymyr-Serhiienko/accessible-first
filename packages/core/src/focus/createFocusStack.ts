import { getActiveElement } from "../dom";
import { focusElement } from "./focusElement";

/**
 * Interface representing a stack-based focus manager.
 * Tracks and preserves the history of focused HTML elements over time, allowing complex UI 
 * flows (like nested dialogs or menus) to capture active focus, push or pop elements, 
 * and accurately restore focus to previously active elements.
 */
export interface FocusStack {
    capture(node: Node): HTMLElement | null;
    push(element: HTMLElement | null): void;
    pop(): HTMLElement | null;
    peek(): HTMLElement | null;
    restore(): boolean;
    clear(): void;
    size(): number;
}

/**
 * Creates a stack used to capture and restore focus
 * across nested interactive components.
 * 
 * @returns An object containing methods to manage the focus stack state.
 */
export function createFocusStack(): FocusStack {
    const stack: Array<HTMLElement | null> = [];

    function pop(): HTMLElement | null {
        return stack.pop() ?? null;
    }

    return {
        capture(node: Node): HTMLElement | null {
            const element = getActiveElement(node);
            stack.push(element);

            return element;
        },

        push(element: HTMLElement | null): void {
            stack.push(element);
        },

        pop,

        peek(): HTMLElement | null {
            return stack[stack.length - 1] ?? null;
        },

        restore(): boolean {
            return focusElement(pop());
        },

        clear(): void {
            stack.length = 0;
        },

        size(): number {
            return stack.length;
        }
    };
}
