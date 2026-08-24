import {
    RouteResponsiveNavigation,
    type ComposedRouteResponsiveNavigation,
    type RouteResponsiveNavigationNavigateDetail
} from "./af";
import { playgroundLocale, t } from "./localization";
import {
    playgroundRoutes,
    type PlaygroundRoute
} from "./routes";

export type PlaygroundRouteNavigateHandler = (
    route: PlaygroundRoute,
    detail: RouteResponsiveNavigationNavigateDetail<PlaygroundRoute>,
    navigation: ComposedRouteResponsiveNavigation<PlaygroundRoute>
) => void;

export interface NavigationDemoOptions {
    current?: string | null;
    onRouteNavigate?: PlaygroundRouteNavigateHandler | null;
}

export function NavigationDemo(
    options: NavigationDemoOptions = {}
): ComposedRouteResponsiveNavigation<PlaygroundRoute> {
    return RouteResponsiveNavigation<PlaygroundRoute>({
        id: "playground-navigation",
        className: "playground-nav__inner",
        trigger: t("app.navigation.trigger"),
        triggerIconPosition: "start",
        variant: "pills",
        locale: playgroundLocale,
        current: options.current ?? null,
        routes: playgroundRoutes,
        onRouteNavigate(detail, navigation) {
            options.onRouteNavigate?.(detail.route, detail, navigation);
        }
    });
}
