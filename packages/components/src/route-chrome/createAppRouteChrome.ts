import {
    AppHeader,
    type AppHeaderLocale,
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
    type RouteChromeBreadcrumbsOptions,
    type RouteChromeCommandPaletteOptions,
    type RouteChromeCurrentRouteControl,
    type RouteChromeNavigationControl,
    type RouteChromeNavigationOptions,
    type RouteChromeOptions,
    type RouteChromeSearchOptions
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
    /**
     * AppHeader recipe options. Use false to clear/omit the managed header slot.
     * Its locale becomes the default locale for route controls.
     */
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

function getDefaultRouteControlLocale<
    TLocale extends LocaleCode,
    TKey extends string
>(
    header: AppRouteChromeHeaderOptions<TLocale, TKey> | false | undefined
): AppHeaderLocale<TLocale, TKey> | null {
    if (!header) return null;

    return header.locale ?? null;
}

function getNavigationOptions<
    TRoute extends AppRouteDescriptor,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: RouteChromeNavigationOptions<TRoute> | false | undefined,
    locale: AppHeaderLocale<TLocale, TKey> | null
): RouteChromeNavigationOptions<TRoute> | false | undefined {
    if (options === false || locale === null || options?.locale !== undefined) return options;

    return {
        ...(options ?? {}),
        locale
    };
}

function getBreadcrumbOptions<
    TRoute extends AppRouteDescriptor,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: RouteChromeBreadcrumbsOptions<TRoute> | false | undefined,
    locale: AppHeaderLocale<TLocale, TKey> | null
): RouteChromeBreadcrumbsOptions<TRoute> | false | undefined {
    if (options === false || locale === null || options?.locale !== undefined) return options;

    return {
        ...(options ?? {}),
        locale
    };
}

function getSearchOptions<
    TRoute extends AppRouteDescriptor,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: RouteChromeSearchOptions<TRoute> | false | undefined,
    locale: AppHeaderLocale<TLocale, TKey> | null
): RouteChromeSearchOptions<TRoute> | false | undefined {
    if (options === false || options === undefined || locale === null || options.searchLocale !== undefined) {
        return options;
    }

    return {
        ...options,
        searchLocale: locale
    };
}

function getCommandOptions<
    TRoute extends AppRouteDescriptor,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: RouteChromeCommandPaletteOptions<TRoute> | false | undefined,
    locale: AppHeaderLocale<TLocale, TKey> | null
): RouteChromeCommandPaletteOptions<TRoute> | false | undefined {
    if (options === false || options === undefined || locale === null) return options;

    const commandOptions: RouteChromeCommandPaletteOptions<TRoute> = { ...options };

    if (commandOptions.locale === undefined) commandOptions.locale = locale;

    if (commandOptions.searchBoxOptions?.searchLocale === undefined) {
        commandOptions.searchBoxOptions = {
            ...(commandOptions.searchBoxOptions ?? {}),
            searchLocale: locale
        };
    }

    return commandOptions;
}

function getRouteChromeOptions<
    TRoute extends AppRouteDescriptor,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: AppRouteChromeOptions<TRoute, TLocale, TKey>
): RouteChromeOptions<TRoute> {
    const defaultLocale = getDefaultRouteControlLocale(options.header);
    const routeChromeOptions: RouteChromeOptions<TRoute> = {
        routes: options.routes
    };
    const navigation = getNavigationOptions(options.navigation, defaultLocale);
    const breadcrumbs = getBreadcrumbOptions(options.breadcrumbs, defaultLocale);
    const search = getSearchOptions(options.search, defaultLocale);
    const commands = getCommandOptions(options.commands, defaultLocale);

    if ("current" in options) routeChromeOptions.current = options.current ?? null;
    if (options.routeText !== undefined) routeChromeOptions.routeText = options.routeText;
    if (navigation !== undefined) routeChromeOptions.navigation = navigation;
    if (breadcrumbs !== undefined) routeChromeOptions.breadcrumbs = breadcrumbs;
    if (search !== undefined) routeChromeOptions.search = search;
    if (commands !== undefined) routeChromeOptions.commands = commands;
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
