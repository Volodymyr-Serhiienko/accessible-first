/**
 * Defines the operational phase of a UI component.
 * - `"idle"`: Instantiated but not yet initialized or activated.
 * - `"ready"`: Active, bound to event streams, and ready for user interaction.
 * - `"disabled"`: Explicitly locked or paused; ignores interactions but retains configurations.
 * - `"destroyed"`: Permanently disassembled and freed from memory hooks.
 */
export type ComponentState =
    | "idle"
    | "ready"
    | "disabled"
    | "destroyed";

/**
 * A breakdown function executed during component transitions or unmounting routines 
 * to purge event registrations, timeouts, or sub-instance references.
 */
export type ComponentCleanup = () => void;

/**
 * Baseline interface representing a managed DOM element lifecycle wrapper.
 */
export interface Component {
    readonly element: HTMLElement;
    destroy(): void;
    isDestroyed(): boolean;
}

/**
 * Configuration options used to initialize a component's structural lifecycle tracker.
 */
export interface ComponentLifecycleOptions {
    name: string;
    initialState?: ComponentState;
}

/**
 * Interface representing an advanced component manager that enforces explicit runtime lifecycle phases.
 * Tracks reactive phase changes, guards operations post-destruction, and manages task cleanup lists.
 */
export interface ComponentLifecycle extends Component {
    readonly name: string;
    setState(state: ComponentState): void;
    addCleanup(cleanup: ComponentCleanup): void;
}
