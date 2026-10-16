import { addEventListener, type Cleanup } from "./addEventListener";

/** Runs cleanup on a real document exit, retaining it across back/forward-cache hides. */
export function addPageHideCleanup(ownerWindow: Window, cleanup: Cleanup): Cleanup {
    const remove = addEventListener<PageTransitionEvent>(ownerWindow, "pagehide", event => {
        if (event.persisted) return;
        remove();
        cleanup();
    });
    return remove;
}
