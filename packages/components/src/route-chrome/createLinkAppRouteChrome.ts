import {
    getAppRouteHref,
    type AppRouteDescriptor,
    type AppRouteHrefResolver
} from "../app-routes";
import type {
    LinkRoutedAppChromeRenderer,
    LinkRoutedAppContext
} from "../routed-app/createLinkRoutedApp";
import type {
    AccessibleFirstMessageKey,
    LocaleCode
} from "../localization";
import {
    createAppRouteChrome,
    type AppRouteChrome,
    type AppRouteChromeOptions
} from "./createAppRouteChrome";
import type {
    RouteChromeOnRouteActivate,
    RouteChromeRouteActivationDetail
} from "./createRouteChrome";

/**
 * Route metadata accepted by createLinkAppRouteChrome().
 */
export type LinkAppRouteChromeRoute = AppRouteDescriptor;

/**
 * Native-link route activation policy.
 */
export type LinkAppRouteActivationPreventDefault = "auto" | boolean;

/**
 * Options for activating routes through normal browser navigation.
 */
export interface LinkAppRouteActivationOptions<
    TRoute extends LinkAppRouteChromeRoute = LinkAppRouteChromeRoute
> {
    /** Resolves the href used when a route is activated outside a native link. */
    getHref?: AppRouteHrefResolver<TRoute>;
    /** Browser window used for programmatic route activation. Defaults to the event window or global window. */
    ownerWindow?: Window;
    /** Uses location.replace instead of location.assign for programmatic activation. */
    replace?: boolean;
    /** Controls event cancellation. "auto" preserves native anchor clicks and prevents non-link selections. */
    preventDefault?: LinkAppRouteActivationPreventDefault;
}

/**
 * Options for createLinkAppRouteChrome().
 */
export interface LinkAppRouteChromeOptions<
    TRoute extends LinkAppRouteChromeRoute = LinkAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> extends Omit<AppRouteChromeOptions<TRoute, TLocale, TKey>, "current" | "onRouteActivate"> {
    /** Current route for chrome state. Defaults to null for unmatched pages. */
    current?: TRoute | string | null;
    /** Native-link activation behavior used by route search and commands. Pass false to disable it. */
    activationOptions?: LinkAppRouteActivationOptions<TRoute> | false;
}

/**
 * Link app chrome options without current route state supplied by LinkRoutedApp.
 */
export type LinkAppRouteChromeBaseOptions<
    TRoute extends LinkAppRouteChromeRoute = LinkAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> = Omit<LinkAppRouteChromeOptions<TRoute, TLocale, TKey>, "current">;

/**
 * Creates link app chrome options from the current LinkRoutedApp render context.
 */
export type LinkAppRouteChromeOptionsResolver<
    TRoute extends LinkAppRouteChromeRoute = LinkAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> = (
    context: LinkRoutedAppContext<TRoute>
) => LinkAppRouteChromeBaseOptions<TRoute, TLocale, TKey>;

/**
 * Called after a LinkRoutedApp route chrome instance is created.
 */
export type LinkAppRouteChromeCreateHandler<
    TRoute extends LinkAppRouteChromeRoute = LinkAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode
> = (
    chrome: AppRouteChrome<TRoute, TLocale>,
    context: LinkRoutedAppContext<TRoute>
) => void;

/**
 * Options for createLinkAppRouteChromeRenderer().
 */
export interface LinkAppRouteChromeRendererOptions<
    TRoute extends LinkAppRouteChromeRoute = LinkAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> {
    /** Static options or a resolver used for each LinkRoutedApp chrome render. */
    options:
        | LinkAppRouteChromeBaseOptions<TRoute, TLocale, TKey>
        | LinkAppRouteChromeOptionsResolver<TRoute, TLocale, TKey>;
    /** Optional hook for saving generated controls such as navigation focus targets. */
    onCreate?: LinkAppRouteChromeCreateHandler<TRoute, TLocale> | null;
}

function getEventAnchor(event: Event | null | undefined): HTMLAnchorElement | null {
    const target = event?.currentTarget ?? event?.target;

    if (target instanceof HTMLAnchorElement) return target;
    if (target instanceof Element) return target.closest("a[href]");

    return null;
}

function getEventWindow(event: Event | null | undefined): Window | null {
    const target = event?.currentTarget ?? event?.target;

    if (!(target instanceof Node)) return null;

    const ownerDocument = target.nodeType === Node.DOCUMENT_NODE
        ? target as Document
        : target.ownerDocument;

    return ownerDocument?.defaultView ?? null;
}

function getActivationWindow<TRoute extends LinkAppRouteChromeRoute>(
    event: Event | null | undefined,
    options: LinkAppRouteActivationOptions<TRoute>
): Window | null {
    if (options.ownerWindow) return options.ownerWindow;

    return getEventWindow(event) ?? (typeof window === "undefined" ? null : window);
}

function shouldUseNativeLink(
    event: Event | null | undefined,
    preventDefault: LinkAppRouteActivationPreventDefault | undefined
): boolean {
    return Boolean(event && preventDefault !== true && getEventAnchor(event));
}

function getActivationHref<TRoute extends LinkAppRouteChromeRoute>(
    route: TRoute,
    options: LinkAppRouteActivationOptions<TRoute>
): string | null {
    return options.getHref?.(route) ?? getAppRouteHref(route);
}

/**
 * Activates one app route through normal browser navigation.
 */
export function activateLinkAppRoute<
    TRoute extends LinkAppRouteChromeRoute = LinkAppRouteChromeRoute
>(
    detail: RouteChromeRouteActivationDetail<TRoute>,
    options: LinkAppRouteActivationOptions<TRoute> = {}
): boolean {
    const href = getActivationHref(detail.route, options);

    if (!href) return false;

    if (shouldUseNativeLink(detail.event, options.preventDefault)) {
        return true;
    }

    if (options.preventDefault !== false) {
        detail.event?.preventDefault();
    }

    const ownerWindow = getActivationWindow(detail.event, options);

    if (!ownerWindow) return false;

    if (options.replace) {
        ownerWindow.location.replace(href);
    } else {
        ownerWindow.location.assign(href);
    }

    return true;
}

/**
 * Creates a reusable callback for route controls that should navigate through route hrefs.
 */
export function createLinkAppRouteActivationHandler<
    TRoute extends LinkAppRouteChromeRoute = LinkAppRouteChromeRoute
>(
    options: LinkAppRouteActivationOptions<TRoute> = {}
): RouteChromeOnRouteActivate<TRoute> {
    return (detail) => activateLinkAppRoute(detail, options);
}

function getRendererChromeOptions<
    TRoute extends LinkAppRouteChromeRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: LinkAppRouteChromeRendererOptions<TRoute, TLocale, TKey>,
    context: LinkRoutedAppContext<TRoute>
): LinkAppRouteChromeBaseOptions<TRoute, TLocale, TKey> {
    return typeof options.options === "function"
        ? options.options(context)
        : options.options;
}

/**
 * Creates AppRouteChrome for native-link and MPA pages with href-based route activation.
 */
export function createLinkAppRouteChrome<
    TRoute extends LinkAppRouteChromeRoute = LinkAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
>(options: LinkAppRouteChromeOptions<TRoute, TLocale, TKey>): AppRouteChrome<TRoute, TLocale> {
    const {
        activationOptions,
        current,
        ...appChromeOptions
    } = options;
    const nextOptions: AppRouteChromeOptions<TRoute, TLocale, TKey> = {
        ...appChromeOptions,
        current: current ?? null
    };

    if (activationOptions !== false) {
        nextOptions.onRouteActivate = createLinkAppRouteActivationHandler(activationOptions);
    }

    return createAppRouteChrome(nextOptions);
}

/**
 * Creates a LinkRoutedApp.renderChrome callback from declarative route chrome options.
 */
export function createLinkAppRouteChromeRenderer<
    TRoute extends LinkAppRouteChromeRoute = LinkAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
>(
    options: LinkAppRouteChromeRendererOptions<TRoute, TLocale, TKey>
): LinkRoutedAppChromeRenderer<TRoute> {
    return (context) => {
        const chrome = createLinkAppRouteChrome<TRoute, TLocale, TKey>({
            ...getRendererChromeOptions(options, context),
            current: context.route
        });

        options.onCreate?.(chrome, context);

        return chrome;
    };
}