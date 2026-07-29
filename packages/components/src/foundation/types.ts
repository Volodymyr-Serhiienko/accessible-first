/**
 * Runtime state exposed through data-af-state for styling and debugging.
 */
export type ComponentState =
    | "idle"
    | "ready"
    | "disabled"
    | "destroyed";

/**
 * Cleanup callback registered by a component.
 * Used for event listeners, timers, nested behaviors, and other teardown work.
 */
export type ComponentCleanup = () => void;

/**
 * Shared base interface for every Accessible First component controller.
 */
export interface Component<TElement extends HTMLElement = HTMLElement> {
    readonly element: TElement;
    destroy(): void;
    isDestroyed(): boolean;
}

/**
 * Options for createComponentLifecycle().
 */
export interface ComponentLifecycleOptions {
    name: string;
    initialState?: ComponentState;
}

/**
 * Internal lifecycle helper used by components to expose state,
 * collect cleanups, and guard work after destroy().
 */
export interface ComponentLifecycle extends Component {
    readonly name: string;
    setState(state: ComponentState): void;
    addCleanup(cleanup: ComponentCleanup): void;
}
