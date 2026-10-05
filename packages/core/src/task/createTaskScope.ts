/** A cancellable operation owned by a view or another disposable resource. */
export interface ScopedTask {
    /** Signal for APIs that support aborting their work. */
    readonly signal: AbortSignal;
    /** Whether this operation still belongs to the live scope. */
    isCurrent(): boolean;
    /** Registers cleanup, or runs it immediately if the operation is obsolete. */
    addCleanup(cleanup: () => void): void;
}

/** Owns one current operation and its subscriptions; starting another cancels the first. */
export interface TaskScope {
    /** Starts a task, cancelling the previous task and its follow-ups. */
    begin(): ScopedTask;
    /** Cancels the current task without disposing the scope. */
    cancel(): void;
    /** Permanently disposes the scope; later tasks are already cancelled. */
    destroy(): void;
}

/** Prevents late async results and callbacks from acting on a replaced or removed view. */
export function createTaskScope(): TaskScope {
    let current: AbortController | null = null;
    let disposed = false;
    let cleanups: (() => void)[] = [];

    function cancel(): void {
        const previous = current;
        const owned = cleanups;
        current = null;
        cleanups = [];
        // Unsubscribe before abort handlers can produce terminal notifications.
        try { for (const cleanup of owned) cleanup(); }
        finally { previous?.abort(); }
    }

    return {
        begin(): ScopedTask {
            cancel();
            const controller = new AbortController();
            if (disposed) controller.abort();
            else current = controller;
            const isCurrent = (): boolean => current === controller && !controller.signal.aborted;
            return {
                signal: controller.signal,
                isCurrent,
                addCleanup(cleanup): void {
                    if (isCurrent()) cleanups.push(cleanup);
                    else cleanup();
                }
            };
        },
        cancel,
        destroy(): void { disposed = true; cancel(); }
    };
}
