import { focusProgrammatically } from "../../../core/src/focus";

/**
 * Element or resolver accepted by FocusRoute helpers.
 */
export type FocusRouteTarget =
    | HTMLElement
    | null
    | undefined
    | (() => HTMLElement | null | undefined);

/**
 * Scheduling strategy for focus moves that depend on DOM updates.
 */
export type FocusRouteSchedule = "sync" | "animation-frame" | "double-animation-frame";

/**
 * Options for runFocusRoute().
 */
export interface FocusRouteOptions {
    target: FocusRouteTarget;
    fallback?: FocusRouteTarget;
    scroll?: boolean | ScrollIntoViewOptions;
    focusOptions?: FocusOptions;
}

/**
 * Options for scheduleFocusRoute().
 */
export interface ScheduledFocusRouteOptions extends FocusRouteOptions {
    schedule?: FocusRouteSchedule;
    ownerWindow?: Window;
}

/**
 * Result returned by a synchronous focus route run.
 */
export interface FocusRouteResult {
    readonly target: HTMLElement | null;
    readonly focused: boolean;
    readonly scrolled: boolean;
}

/**
 * Cancel handle returned by scheduleFocusRoute().
 */
export interface ScheduledFocusRoute {
    cancel(): void;
}

/**
 * Resolves a focus route target to an HTMLElement or null.
 */
export function resolveFocusRouteTarget(target: FocusRouteTarget): HTMLElement | null {
    if (typeof target === "function") {
        return target() ?? null;
    }

    return target ?? null;
}

function getScrollOptions(scroll: FocusRouteOptions["scroll"]): ScrollIntoViewOptions | null {
    if (scroll === undefined || scroll === false) return null;

    if (scroll === true) {
        return {
            block: "center",
            inline: "nearest",
            behavior: "auto"
        };
    }

    return scroll;
}

function getOwnerWindow(options: ScheduledFocusRouteOptions): Window {
    const target =
        resolveFocusRouteTarget(options.target)
        ?? resolveFocusRouteTarget(options.fallback);

    return options.ownerWindow
        ?? target?.ownerDocument.defaultView
        ?? window;
}

/**
 * Resolves, optionally scrolls, and focuses one workflow target immediately.
 */
export function runFocusRoute(options: FocusRouteOptions): FocusRouteResult {
    const target =
        resolveFocusRouteTarget(options.target)
        ?? resolveFocusRouteTarget(options.fallback);

    if (!target) {
        return {
            target: null,
            focused: false,
            scrolled: false
        };
    }

    const scrollOptions = getScrollOptions(options.scroll);
    let scrolled = false;

    if (scrollOptions) {
        target.scrollIntoView(scrollOptions);
        scrolled = true;
    }

    return {
        target,
        focused: focusProgrammatically(target, options.focusOptions ?? { preventScroll: true }),
        scrolled
    };
}

/**
 * Schedules a workflow focus move after the current render frame.
 */
export function scheduleFocusRoute(options: ScheduledFocusRouteOptions): ScheduledFocusRoute {
    const ownerWindow = getOwnerWindow(options);
    const schedule = options.schedule ?? "animation-frame";
    const frameIds: number[] = [];
    let cancelled = false;

    function run(): void {
        if (cancelled) return;

        runFocusRoute(options);
    }

    function scheduleFrame(callback: FrameRequestCallback): void {
        frameIds.push(ownerWindow.requestAnimationFrame(callback));
    }

    if (schedule === "sync") {
        run();
    } else if (schedule === "double-animation-frame") {
        scheduleFrame(() => {
            scheduleFrame(run);
        });
    } else {
        scheduleFrame(run);
    }

    return {
        cancel(): void {
            cancelled = true;

            for (const frameId of frameIds) {
                ownerWindow.cancelAnimationFrame(frameId);
            }
        }
    };
}
