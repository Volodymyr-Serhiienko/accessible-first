import type { AppRouteDescriptor } from "../app-routes";
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