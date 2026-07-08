import { createOverlayStack } from "./createOverlayStack";

/**
 * Global default shared instance of the `OverlayStack`.
 * Serves as the central registry across all decoupled components (modals, popovers, context menus)
 * to orchestrate global stacking order, focus nesting, and dismiss hierarchies.
 */
export const defaultOverlayStack = createOverlayStack();