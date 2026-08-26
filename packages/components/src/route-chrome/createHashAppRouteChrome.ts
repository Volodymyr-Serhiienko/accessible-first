import type { AppRouteDescriptor } from "../app-routes";
import type {
    HashRoutedAppChromeRenderer,
    HashRoutedAppContext
} from "../routed-app/createHashRoutedApp";
import type {
    AccessibleFirstMessageKey,
    LocaleCode
} from "../localization";
import {
    createHashRouterRouteActivationHandler,
    type HashRouter,
    type HashRouterRoute,
    type HashRouterRouteActivationOptions
} from "../routing";
import {
    createAppRouteChrome,
    type AppRouteChrome,
    type AppRouteChromeOptions
} from "./createAppRouteChrome";

/**
 * Route metadata accepted by createHashAppRouteChrome().
 */
export type HashAppRouteChromeRoute = AppRouteDescriptor & HashRouterRoute;

/**
 * Options for createHashAppRouteChrome().
 */
export interface HashAppRouteChromeOptions<
    TRoute extends HashAppRouteChromeRoute = HashAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> extends Omit<AppRouteChromeOptions<TRoute, TLocale, TKey>, "current" | "onRouteActivate"> {
    /** Hash router that owns navigation, history, focus, and route rendering. */
    router: HashRouter<TRoute>;
    /** Current route for chrome state. Defaults to router.getCurrentRoute(). */
    current?: TRoute | string | null;
    /** Activation behavior used by navigation, route search, and commands. */
    activationOptions?: HashRouterRouteActivationOptions;
}

/**
 * Hash app chrome options without the router-owned state supplied by HashRoutedApp.
 */
export type HashAppRouteChromeBaseOptions<
    TRoute extends HashAppRouteChromeRoute = HashAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> = Omit<HashAppRouteChromeOptions<TRoute, TLocale, TKey>, "router" | "current">;

/**
 * Creates hash app chrome options from the current HashRoutedApp render context.
 */
export type HashAppRouteChromeOptionsResolver<
    TRoute extends HashAppRouteChromeRoute = HashAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> = (
    context: HashRoutedAppContext<TRoute>
) => HashAppRouteChromeBaseOptions<TRoute, TLocale, TKey>;

/**
 * Called after a HashRoutedApp route chrome instance is created.
 */
export type HashAppRouteChromeCreateHandler<
    TRoute extends HashAppRouteChromeRoute = HashAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode
> = (
    chrome: AppRouteChrome<TRoute, TLocale>,
    context: HashRoutedAppContext<TRoute>
) => void;

/**
 * Options for createHashAppRouteChromeRenderer().
 */
export interface HashAppRouteChromeRendererOptions<
    TRoute extends HashAppRouteChromeRoute = HashAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> {
    /** Static options or a resolver used for each HashRoutedApp chrome render. */
    options:
        | HashAppRouteChromeBaseOptions<TRoute, TLocale, TKey>
        | HashAppRouteChromeOptionsResolver<TRoute, TLocale, TKey>;
    /** Optional hook for saving generated controls such as navigation focus targets. */
    onCreate?: HashAppRouteChromeCreateHandler<TRoute, TLocale> | null;
}

const defaultActivationOptions: HashRouterRouteActivationOptions = {
    updateHistory: true,
    scroll: true,
    focusTarget: "outlet"
};

function getActivationOptions(
    options: HashRouterRouteActivationOptions | undefined
): HashRouterRouteActivationOptions {
    return {
        ...defaultActivationOptions,
        ...(options ?? {})
    };
}

function getRendererChromeOptions<
    TRoute extends HashAppRouteChromeRoute,
    TLocale extends LocaleCode,
    TKey extends string
>(
    options: HashAppRouteChromeRendererOptions<TRoute, TLocale, TKey>,
    context: HashRoutedAppContext<TRoute>
): HashAppRouteChromeBaseOptions<TRoute, TLocale, TKey> {
    return typeof options.options === "function"
        ? options.options(context)
        : options.options;
}

/**
 * Creates AppRouteChrome for hash-routed SPAs with standard route activation defaults.
 */
export function createHashAppRouteChrome<
    TRoute extends HashAppRouteChromeRoute = HashAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
>(options: HashAppRouteChromeOptions<TRoute, TLocale, TKey>): AppRouteChrome<TRoute, TLocale> {
    const {
        router,
        activationOptions,
        current,
        ...appChromeOptions
    } = options;
    const routeActivation = createHashRouterRouteActivationHandler(
        router,
        getActivationOptions(activationOptions)
    );
    const nextOptions: AppRouteChromeOptions<TRoute, TLocale, TKey> = {
        ...appChromeOptions,
        current: "current" in options ? current ?? null : router.getCurrentRoute(),
        onRouteActivate: routeActivation
    };

    return createAppRouteChrome(nextOptions);
}

/**
 * Creates a HashRoutedApp.renderChrome callback from declarative route chrome options.
 */
export function createHashAppRouteChromeRenderer<
    TRoute extends HashAppRouteChromeRoute = HashAppRouteChromeRoute,
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
>(
    options: HashAppRouteChromeRendererOptions<TRoute, TLocale, TKey>
): HashRoutedAppChromeRenderer<TRoute> {
    return (context) => {
        const chrome = createHashAppRouteChrome<TRoute, TLocale, TKey>({
            ...getRendererChromeOptions(options, context),
            router: context.router,
            current: context.route
        });

        options.onCreate?.(chrome, context);

        return chrome;
    };
}
