import {
    createHashRouterRouteActivationHandler,
    RouteResponsiveNavigation,
    type ComposedRouteResponsiveNavigation,
    type HashRouter,
    type RouteResponsiveNavigationOnRouteNavigate
} from "./af";
import { playgroundLocale, t } from "./localization";
import {
    playgroundRoutes,
    type PlaygroundRoute
} from "./routes";

export type PlaygroundRouteNavigateHandler = RouteResponsiveNavigationOnRouteNavigate<PlaygroundRoute>;

export interface NavigationDemoOptions {
    current?: string | null;
    router?: HashRouter<PlaygroundRoute> | null;
    onRouteNavigate?: PlaygroundRouteNavigateHandler | null;
}

export function NavigationDemo(
    options: NavigationDemoOptions = {}
): ComposedRouteResponsiveNavigation<PlaygroundRoute> {
    const onRouteNavigate = options.onRouteNavigate
        ?? (options.router
            ? createHashRouterRouteActivationHandler(options.router, {
                updateHistory: true,
                scroll: true,
                focusTarget: "outlet"
            })
            : null);

    return RouteResponsiveNavigation<PlaygroundRoute>({
        id: "playground-navigation",
        className: "playground-nav__inner",
        trigger: t("app.navigation.trigger"),
        triggerIconPosition: "start",
        variant: "pills",
        locale: playgroundLocale,
        current: options.current ?? null,
        routes: playgroundRoutes,
        onRouteNavigate
    });
}
