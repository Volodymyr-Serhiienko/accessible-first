import type {
    ComponentCleanup,
    ComponentLifecycle,
    ComponentLifecycleOptions,
    ComponentState
} from "./types";
import { restoreAttribute } from "../../../core/src/dom";

/**
 * Creates the shared lifecycle controller used by components.
 *
 * It writes data-af-component and data-af-state for styling/debugging,
 * runs registered cleanups in reverse order, and restores the original
 * lifecycle attributes on destroy().
 */
export function createComponentLifecycle(
    element: HTMLElement,
    options: ComponentLifecycleOptions
): ComponentLifecycle {
    const originalComponent = element.getAttribute("data-af-component");
    const originalState = element.getAttribute("data-af-state");

    const cleanups: ComponentCleanup[] = [];

    let destroyed = false;

    function setState(state: ComponentState): void {
        if (destroyed) {
            return;
        }

        element.setAttribute("data-af-state", state);
    }

    element.setAttribute("data-af-component", options.name);
    setState(options.initialState ?? "ready");

    return {
        element,
        name: options.name,

        setState,

        addCleanup(cleanup: ComponentCleanup): void {
            if (destroyed) {
                cleanup();
                return;
            }

            cleanups.push(cleanup);
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;

            for (const cleanup of [...cleanups].reverse()) {
                cleanup();
            }

            cleanups.length = 0;

            restoreAttribute(element, "data-af-component", originalComponent);
            restoreAttribute(element, "data-af-state", originalState);
        },

        isDestroyed(): boolean {
            return destroyed;
        }
    };
}
