import type {
    ComponentCleanup,
    ComponentLifecycle,
    ComponentLifecycleOptions,
    ComponentState
} from "./types";

function restoreAttribute(
    element: HTMLElement,
    name: string,
    value: string | null
): void {
    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
}

/**
 * Creates and initializes a component runtime lifecycle management state machine.
 * Decorates a target root element with identifying dataset signatures (`data-af-component`, `data-af-state`)
 * to expose active execution phases. Provides a tracking pipeline to safely capture and queue unbinding procedures,
 * which are executed in reverse order (LIFO) upon component teardown to guarantee pristine attribute state restoration.
 *
 * @param element - The core DOM element being bound to the lifecycle scope.
 * @param options - Core diagnostic tagging configurations and initial state values.
 * @returns A ComponentLifecycle manager interface offering state controls and cleanup hooks.
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
