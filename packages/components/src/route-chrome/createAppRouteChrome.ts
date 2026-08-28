import {
    AppHeader,
    type AppHeaderOptions,
    type ComposedAppHeader
} from "../app-header";
import type {
    AppShellCompositionContent,
    AppShellUpdateOptions
} from "../app-shell";
import type { AppRouteDescriptor } from "../app-routes";
import {
    toCompositionChildren,
    type CompositionChild
} from "../composition";
import type {
    AccessibleFirstMessageKey,
    LocaleCode
} from "../localization";
import {
    ResponsiveNavigationFocusLink,
    type ComposedResponsiveNavigationFocusLink,
    type ResponsiveNavigationFocusLinkOptions
} from "../responsive-navigation";
import {
    createRouteChrome,
    type RouteChrome,
    type RouteChromeCurrentRouteControl,
    type RouteChromeNavigationControl,
    type RouteChromeOptions
} from "./createRouteChrome";

/**
 * Position for route-created controls relative to custom AppHeader controls.
 */
export type AppRouteChromeRouteControlsPlacement = "start" | "end";

/**
 * AppHeader options accepted by createAppRouteChrome().
 */
export interface AppRouteChromeHeaderOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> extends Omit<AppHeaderOptions<TLocale, TKey>, "controls"> {
    /** Additional app controls placed beside route search and commands. */
    controls?: CompositionChild[];
    /** Places route search and commands before or after custom controls. Defaults to "start". */
    routeControlsPlacement?: AppRouteChromeRouteControlsPlacement;
}

/**
 * Options for the optional after-outlet link that returns focus to route navigation.
 */
export type AppRouteChromeNavigationReturnLinkOptions = Omit<
    ResponsiveNavigationFocusLinkOptions,
    "navigation"
>;

/**
 * Shell slots produced by createAppRouteChrome().
 */
export interface AppRouteChromeSlots {
    shell?: AppShellUpdateOptions;
    header?: AppShellCompositionContent | null;
    navigation?: AppShellCompositionContent | null;
    beforeOutlet?: AppShellCompositionContent | null;
    afterOutlet?: AppShellCompositionContent | null;
    footer?: AppShellCompositionContent | null;
}

/**
 * Options for createAppRouteChrome().
 */
export interface AppRouteChromeOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> extends RouteChromeOptions<TRoute> {
    /** Optional shell updates to return with the generated chrome slots. */
    shell?: AppShellUpdateOptions;
    /** AppHeader recipe options. Use false to clear/omit the managed header slot. */
    header?: AppRouteChromeHeaderOptions<TLocale, TKey> | false;
    /** Optional after-outlet link that returns focus to the generated route navigation. */
    navigationReturnLink?: AppRouteChromeNavigationReturnLinkOptions | false | null;
    /** Optional content returned for the shell after-outlet slot. */
    afterOutlet?: AppShellCompositionContent | null;
    /** Optional content returned for the shell footer slot. */
    footer?: AppShellCompositionContent | null;
}

/**
 * Route-aware app chrome produced by createAppRouteChrome().
 */
export interface AppRouteChrome<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor,
    TLocale extends LocaleCode = LocaleCode
> extends AppRouteChromeSlots {
    readonly routeChrome: RouteChrome<TRoute>;
    readonly appHeader: ComposedAppHeader<TLocale> | null;
    readonly navigationControl: RouteChromeNavigationControl | null;
    readonly currentRouteControls: readonly RouteChromeCurrentRouteControl<TRoute>[];
}

function getRouteChromeOptions<
    TRoute extends AppRouteDescriptor,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: AppRouteChromeOptions<TRoute, TLocale, TKey>
): RouteChromeOptions<TRoute> {
    const routeChromeOptions: RouteChromeOptions<TRoute> = {
        routes: options.routes
    };

    if ("current" in options) routeChromeOptions.current = options.current ?? null;
    if (options.routeText !== undefined) routeChromeOptions.routeText = options.routeText;
    if (options.navigation !== undefined) routeChromeOptions.navigation = options.navigation;
    if (options.breadcrumbs !== undefined) routeChromeOptions.breadcrumbs = options.breadcrumbs;
    if (options.search !== undefined) routeChromeOptions.search = options.search;
    if (options.commands !== undefined) routeChromeOptions.commands = options.commands;
    if ("onRouteActivate" in options) {
        routeChromeOptions.onRouteActivate = options.onRouteActivate ?? null;
    }

    return routeChromeOptions;
}

function getHeaderControls(
    routeControls: readonly CompositionChild[],
    customControls: readonly CompositionChild[] | undefined,
    placement: AppRouteChromeRouteControlsPlacement | undefined
): CompositionChild[] {
    const controls = [...(customControls ?? [])];
    const routeHeaderControls = [...routeControls];

    return placement === "end"
        ? [...controls, ...routeHeaderControls]
        : [...routeHeaderControls, ...controls];
}

function createAppRouteHeader<
    TLocale extends LocaleCode,
    TKey extends string
>(
    routeControls: readonly CompositionChild[],
    options: AppRouteChromeHeaderOptions<TLocale, TKey> | false | undefined
): ComposedAppHeader<TLocale> | null {
    if (options === false) return null;

    if (options === undefined) {
        if (routeControls.length === 0) return null;

        return AppHeader<TLocale, TKey>({
            controls: [...routeControls],
            language: false,
            theme: false
        });
    }

    const {
        controls: customControls,
        routeControlsPlacement,
        ...appHeaderOptions
    } = options;

    return AppHeader<TLocale, TKey>({
        ...appHeaderOptions,
        controls: getHeaderControls(routeControls, customControls, routeControlsPlacement)
    });
}

function createNavigationReturnLink<TRoute extends AppRouteDescriptor>(
    routeChrome: RouteChrome<TRoute>,
    options: AppRouteChromeNavigationReturnLinkOptions | false | null | undefined
): ComposedResponsiveNavigationFocusLink | null {
    if (!options || !routeChrome.navigation) return null;

    return ResponsiveNavigationFocusLink({
        ...options,
        navigation: routeChrome.navigation
    });
}

function getAfterOutletContent<
    TRoute extends AppRouteDescriptor,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: AppRouteChromeOptions<TRoute, TLocale, TKey>,
    navigationReturnLink: ComposedResponsiveNavigationFocusLink | null
): AppShellCompositionContent | undefined {
    const hasAfterOutlet = "afterOutlet" in options;

    if (!navigationReturnLink) {
        return hasAfterOutlet ? options.afterOutlet ?? null : undefined;
    }

    return [
        navigationReturnLink,
        ...toCompositionChildren(hasAfterOutlet ? options.afterOutlet : null)
    ];
}

/**
 * Creates a route-aware AppHeader, navigation, breadcrumbs, and route-control bindings for app shells.
 */
export function createAppRouteChrome<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
>(options: AppRouteChromeOptions<TRoute, TLocale, TKey>): AppRouteChrome<TRoute, TLocale> {
    const routeChrome = createRouteChrome(getRouteChromeOptions(options));
    const appHeader = createAppRouteHeader<TLocale, TKey>(routeChrome.headerControls, options.header);
    const navigationReturnLink = createNavigationReturnLink(routeChrome, options.navigationReturnLink);
    const afterOutlet = getAfterOutletContent(options, navigationReturnLink);
    const appRouteChrome: AppRouteChrome<TRoute, TLocale> = {
        routeChrome,
        appHeader,
        navigation: routeChrome.navigation,
        beforeOutlet: routeChrome.breadcrumbs,
        navigationControl: routeChrome.navigationControl,
        currentRouteControls: routeChrome.currentRouteControls
    };

    if (appHeader || options.header === false) appRouteChrome.header = appHeader;
    if (options.shell !== undefined) appRouteChrome.shell = options.shell;
    if (afterOutlet !== undefined) appRouteChrome.afterOutlet = afterOutlet;
    if ("footer" in options) appRouteChrome.footer = options.footer ?? null;

    return appRouteChrome;
}