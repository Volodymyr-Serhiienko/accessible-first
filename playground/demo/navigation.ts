import {
    ResponsiveNavigation,
    type ComposedResponsiveNavigation,
    type NavigationItem,
    type NavigationNavigateDetail
} from "./af";
import {
    getPlaygroundRouteById,
    playgroundNavigationItems,
    type PlaygroundRoute
} from "./routes";

export type PlaygroundRouteNavigateHandler = (
    route: PlaygroundRoute,
    detail: NavigationNavigateDetail,
    navigation: ComposedResponsiveNavigation
) => void;

export interface NavigationDemoOptions {
    current?: string | null;
    onRouteNavigate?: PlaygroundRouteNavigateHandler | null;
}

function getRouteFromNavigationItem(item: NavigationItem): PlaygroundRoute | null {
    return getPlaygroundRouteById(item.id ?? item.href ?? null);
}

export function NavigationDemo(options: NavigationDemoOptions = {}): ComposedResponsiveNavigation {
    return ResponsiveNavigation({
        className: "playground-nav__inner",
        trigger: "Sections",
        triggerIconPosition: "start",
        variant: "pills",
        current: options.current ?? null,
        items: playgroundNavigationItems,
        onNavigate(detail, navigation) {
            const route = getRouteFromNavigationItem(detail.item);

            if (!route) return;

            options.onRouteNavigate?.(route, detail, navigation);
        }
    });
}
