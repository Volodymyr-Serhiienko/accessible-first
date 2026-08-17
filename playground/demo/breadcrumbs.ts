import {
    RouteBreadcrumbs,
    type AppRouteDescriptor,
    type ComposedRouteBreadcrumbs
} from "./af";
import { playgroundRoutes, type PlaygroundRoute } from "./routes";

export interface ComposedPlaygroundBreadcrumbs
    extends ComposedRouteBreadcrumbs<AppRouteDescriptor> {
    setRoute(route: PlaygroundRoute): void;
}

const playgroundRootRoute: AppRouteDescriptor = {
    id: "playground",
    title: "Accessible First Playground",
    label: "Playground",
    href: "#buttons"
};

const playgroundBreadcrumbRoutes: AppRouteDescriptor[] = [
    playgroundRootRoute,
    ...playgroundRoutes
];

function getParentId(route: AppRouteDescriptor): string | null {
    if (route.id === playgroundRootRoute.id) return null;

    return route.parentId ?? playgroundRootRoute.id;
}

export function PlaygroundBreadcrumbs(route: PlaygroundRoute): ComposedPlaygroundBreadcrumbs {
    const breadcrumbs = RouteBreadcrumbs<AppRouteDescriptor>({
        className: "playground-breadcrumbs",
        label: "Current playground location",
        routes: playgroundBreadcrumbRoutes,
        current: route,
        trailOptions: {
            getParentId
        }
    });

    return Object.assign(breadcrumbs, {
        setRoute(nextRoute: PlaygroundRoute): void {
            breadcrumbs.setCurrent(nextRoute);
        }
    });
}
