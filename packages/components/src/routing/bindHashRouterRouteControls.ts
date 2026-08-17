import type {
    HashRouter,
    HashRouterNavigation,
    HashRouterRoute,
    HashRouterUnsubscribe
} from "./createHashRouter";

/**
 * Route-aware control that can mirror the current HashRouter route.
 */
export interface HashRouterCurrentRouteControl<TRoute extends HashRouterRoute> {
    setCurrent(current: TRoute | string | null | undefined): void;
}

/**
 * Controls synchronized by bindHashRouterRouteControls().
 */
export interface HashRouterRouteControls<TRoute extends HashRouterRoute> {
    navigation?: HashRouterNavigation | null;
    currentRouteControls?: readonly HashRouterCurrentRouteControl<TRoute>[];
}

/**
 * Keeps navigation and current-route controls synchronized with a HashRouter.
 */
export function bindHashRouterRouteControls<TRoute extends HashRouterRoute>(
    router: HashRouter<TRoute>,
    controls: HashRouterRouteControls<TRoute>
): HashRouterUnsubscribe {
    function sync(route: TRoute): void {
        controls.navigation?.setCurrent(route.id);

        controls.currentRouteControls?.forEach((control) => {
            control.setCurrent(route);
        });
    }

    if ("navigation" in controls) {
        router.setNavigation(controls.navigation ?? null);
    }

    sync(router.getCurrentRoute());

    return router.subscribe((route) => {
        sync(route);
    });
}
