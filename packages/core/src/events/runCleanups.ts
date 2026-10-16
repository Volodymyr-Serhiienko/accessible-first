import type { Cleanup } from "./addEventListener";

/** Runs every cleanup in order, then rethrows the first failure without hiding it. */
export function runCleanups(cleanups: Iterable<Cleanup>): void {
    let failed = false;
    let failure: unknown;
    for (const cleanup of cleanups) {
        try { cleanup(); }
        catch (error) {
            if (!failed) failure = error;
            failed = true;
        }
    }
    if (failed) throw failure;
}
