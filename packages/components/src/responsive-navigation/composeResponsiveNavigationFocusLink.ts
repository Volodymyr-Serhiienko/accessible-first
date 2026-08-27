import {
    FocusRouteLink,
    type ComposedFocusRouteLink,
    type FocusRouteLinkOptions,
    type FocusRouteLinkUpdateOptions,
    type FocusRouteTarget
} from "../focus-route";
import type { ComposedResponsiveNavigation } from "./composeResponsiveNavigation";

/**
 * ResponsiveNavigation instance or resolver accepted by ResponsiveNavigationFocusLink().
 */
export type ResponsiveNavigationFocusLinkNavigation =
    | ComposedResponsiveNavigation
    | null
    | undefined
    | (() => ComposedResponsiveNavigation | null | undefined);

/**
 * Options for ResponsiveNavigationFocusLink(), a link that returns focus to responsive navigation.
 */
export interface ResponsiveNavigationFocusLinkOptions extends Omit<FocusRouteLinkOptions, "focusTarget"> {
    /** Navigation instance or resolver used to find the best visible return target. */
    navigation: ResponsiveNavigationFocusLinkNavigation;
}

/**
 * Options accepted by ComposedResponsiveNavigationFocusLink.update().
 */
export interface ResponsiveNavigationFocusLinkUpdateOptions extends Partial<ResponsiveNavigationFocusLinkOptions> {}

/**
 * FocusRouteLink specialized for returning to a ResponsiveNavigation instance.
 */
export interface ComposedResponsiveNavigationFocusLink extends Omit<ComposedFocusRouteLink, "update"> {
    update(options: ResponsiveNavigationFocusLinkUpdateOptions): void;
}

function resolveNavigation(
    navigation: ResponsiveNavigationFocusLinkNavigation
): ComposedResponsiveNavigation | null {
    if (typeof navigation === "function") return navigation() ?? null;

    return navigation ?? null;
}

function getFocusTarget(
    navigation: ResponsiveNavigationFocusLinkNavigation
): FocusRouteTarget {
    return () => resolveNavigation(navigation)?.getFocusTarget() ?? null;
}

function getFocusRouteLinkOptions(
    options: ResponsiveNavigationFocusLinkOptions | ResponsiveNavigationFocusLinkUpdateOptions
): FocusRouteLinkUpdateOptions {
    const {
        navigation: _navigation,
        ...focusRouteLinkOptions
    } = options;

    return focusRouteLinkOptions;
}

/**
 * Creates a visible link that moves focus back to the best ResponsiveNavigation target.
 */
export function ResponsiveNavigationFocusLink(
    options: ResponsiveNavigationFocusLinkOptions
): ComposedResponsiveNavigationFocusLink {
    let navigation = options.navigation;
    const link = FocusRouteLink({
        ...getFocusRouteLinkOptions(options),
        focusTarget: getFocusTarget(navigation)
    });

    return Object.assign(link, {
        update(nextOptions: ResponsiveNavigationFocusLinkUpdateOptions): void {
            if ("navigation" in nextOptions) navigation = nextOptions.navigation;

            link.update({
                ...getFocusRouteLinkOptions(nextOptions),
                focusTarget: getFocusTarget(navigation)
            });
        }
    }) as ComposedResponsiveNavigationFocusLink;
}