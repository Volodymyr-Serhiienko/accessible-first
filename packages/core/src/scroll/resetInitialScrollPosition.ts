/**
 * Options for resetInitialScrollPosition().
 */
export interface InitialScrollResetOptions {
    /** Window whose page scroll should be reset. Defaults to the global window. */
    ownerWindow?: Window;
    /** Horizontal scroll position. Defaults to 0. */
    left?: number;
    /** Vertical scroll position. Defaults to 0. */
    top?: number;
    /** Native scroll behavior. Defaults to "auto". */
    behavior?: ScrollBehavior;
    /** Number of animation frames that should repeat the reset after the immediate call. Defaults to 2. */
    frameCount?: number;
    /** Sets history.scrollRestoration to "manual" when supported. Defaults to true. */
    manualRestoration?: boolean;
}

/**
 * Controller returned by resetInitialScrollPosition().
 */
export interface InitialScrollResetController {
    cancel(): void;
    isCanceled(): boolean;
}

function getInitialScrollWindow(ownerWindow: Window | undefined): Window | null {
    if (ownerWindow) return ownerWindow;

    return typeof window === "undefined" ? null : window;
}

function normalizeFrameCount(frameCount: number | undefined): number {
    const value = frameCount ?? 2;

    if (!Number.isFinite(value)) return 0;

    return Math.max(0, Math.floor(value));
}

function scrollToPosition(ownerWindow: Window, options: InitialScrollResetOptions): void {
    ownerWindow.scrollTo({
        left: options.left ?? 0,
        top: options.top ?? 0,
        behavior: options.behavior ?? "auto"
    });
}

/**
 * Resets the initial page scroll position during app startup.
 *
 * The helper performs one immediate scroll reset and then repeats it for a few
 * animation frames. This keeps mobile browsers and restored tabs from reopening
 * a freshly rendered SPA at the previous bottom-of-page position.
 */
export function resetInitialScrollPosition(
    options: InitialScrollResetOptions = {}
): InitialScrollResetController {
    const ownerWindow = getInitialScrollWindow(options.ownerWindow);
    const frameIds: number[] = [];

    let canceled = false;

    function cancel(): void {
        if (canceled) return;

        canceled = true;

        if (!ownerWindow) return;

        for (const frameId of frameIds) {
            ownerWindow.cancelAnimationFrame(frameId);
        }

        frameIds.length = 0;
    }

    const controller: InitialScrollResetController = {
        cancel,

        isCanceled(): boolean {
            return canceled;
        }
    };

    if (!ownerWindow) return controller;

    const scrollWindow = ownerWindow;

    if ((options.manualRestoration ?? true) && "scrollRestoration" in scrollWindow.history) {
        scrollWindow.history.scrollRestoration = "manual";
    }

    function scheduleFrame(remainingFrames: number): void {
        if (remainingFrames <= 0 || canceled) return;

        const frameId = scrollWindow.requestAnimationFrame(() => {
            const index = frameIds.indexOf(frameId);

            if (index >= 0) frameIds.splice(index, 1);
            if (canceled) return;

            scrollToPosition(scrollWindow, options);
            scheduleFrame(remainingFrames - 1);
        });

        frameIds.push(frameId);
    }

    scrollToPosition(scrollWindow, options);
    scheduleFrame(normalizeFrameCount(options.frameCount));

    return controller;
}
