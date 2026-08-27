import {
    Link,
    type ComposedLink,
    type LinkCompositionOptions,
    type LinkCompositionUpdateOptions
} from "../link";
import {
    runFocusRoute,
    type FocusRouteOptions,
    type FocusRouteResult,
    type FocusRouteTarget
} from "./createFocusRoute";

/**
 * Called after FocusRouteLink activates its configured focus target.
 */
export type FocusRouteLinkOnNavigate = (
    event: Event,
    link: ComposedFocusRouteLink,
    result: FocusRouteResult
) => void;

/**
 * Options for FocusRouteLink(), a composed link that moves focus to a workflow target.
 */
export interface FocusRouteLinkOptions extends Omit<LinkCompositionOptions, "onNavigate"> {
    /** Element or resolver that should receive focus when the link is activated. */
    focusTarget: FocusRouteTarget;
    /** Optional fallback target used when focusTarget cannot be resolved. */
    fallbackFocusTarget?: FocusRouteTarget;
    /** Scroll behavior applied before focus is moved. */
    scroll?: FocusRouteOptions["scroll"];
    /** Native focus options passed to the target focus call. */
    focusOptions?: FocusOptions;
    /** Prevents normal link navigation before moving focus. Defaults to true. */
    preventDefault?: boolean;
    /** Optional callback fired after the focus route runs. */
    onNavigate?: FocusRouteLinkOnNavigate | null;
}

/**
 * Options accepted by ComposedFocusRouteLink.update().
 */
export interface FocusRouteLinkUpdateOptions extends Partial<FocusRouteLinkOptions> {}

/**
 * Link component that activates a FocusRoute workflow target.
 */
export interface ComposedFocusRouteLink extends Omit<ComposedLink, "update"> {
    focusTarget(): FocusRouteResult;
    update(options: FocusRouteLinkUpdateOptions): void;
}

function getRunFocusRouteOptions(
    focusTarget: FocusRouteTarget,
    fallbackFocusTarget: FocusRouteTarget | undefined,
    scroll: FocusRouteOptions["scroll"],
    focusOptions: FocusOptions | undefined
): FocusRouteOptions {
    const options: FocusRouteOptions = {
        target: focusTarget
    };

    if (fallbackFocusTarget !== undefined) options.fallback = fallbackFocusTarget;
    if (scroll !== undefined) options.scroll = scroll;
    if (focusOptions !== undefined) options.focusOptions = focusOptions;

    return options;
}

function getLinkOptions(options: FocusRouteLinkOptions | FocusRouteLinkUpdateOptions): LinkCompositionUpdateOptions {
    const {
        focusTarget: _focusTarget,
        fallbackFocusTarget: _fallbackFocusTarget,
        scroll: _scroll,
        focusOptions: _focusOptions,
        preventDefault: _preventDefault,
        onNavigate: _onNavigate,
        ...linkOptions
    } = options;

    return linkOptions;
}

/**
 * Creates a link that moves focus to a meaningful workflow target instead of duplicating focus glue.
 */
export function FocusRouteLink(options: FocusRouteLinkOptions): ComposedFocusRouteLink {
    let composed!: ComposedFocusRouteLink;
    let focusTarget = options.focusTarget;
    let fallbackFocusTarget = options.fallbackFocusTarget;
    let scroll = options.scroll;
    let focusOptions = options.focusOptions;
    let preventDefault = options.preventDefault ?? true;
    let onNavigate = options.onNavigate ?? null;

    function focusTargetNow(): FocusRouteResult {
        return runFocusRoute(getRunFocusRouteOptions(
            focusTarget,
            fallbackFocusTarget,
            scroll,
            focusOptions
        ));
    }

    const link = Link({
        ...getLinkOptions(options),
        onNavigate(event) {
            if (preventDefault) event.preventDefault();

            const result = focusTargetNow();

            onNavigate?.(event, composed, result);
        }
    });

    composed = Object.assign(link, {
        focusTarget: focusTargetNow,

        update(nextOptions: FocusRouteLinkUpdateOptions): void {
            if ("focusTarget" in nextOptions) focusTarget = nextOptions.focusTarget;
            if ("fallbackFocusTarget" in nextOptions) {
                fallbackFocusTarget = nextOptions.fallbackFocusTarget;
            }
            if ("scroll" in nextOptions) scroll = nextOptions.scroll;
            if ("focusOptions" in nextOptions) focusOptions = nextOptions.focusOptions;
            if (nextOptions.preventDefault !== undefined) preventDefault = nextOptions.preventDefault;
            if ("onNavigate" in nextOptions) onNavigate = nextOptions.onNavigate ?? null;

            link.update(getLinkOptions(nextOptions));
        }
    }) as ComposedFocusRouteLink;

    return composed;
}