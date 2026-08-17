import {
    Breadcrumbs,
    createAppRouteBreadcrumbItems,
    createAppRouteTrail,
    type AppRouteDescriptor,
    type ComposedBreadcrumbs
} from "./af";
import { playgroundRoutes, type PlaygroundRoute } from "./routes";

export interface ComposedPlaygroundBreadcrumbs extends ComposedBreadcrumbs {
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

function getBreadcrumbItems(route: PlaygroundRoute) {
    const trail = createAppRouteTrail(playgroundBreadcrumbRoutes, route, {
        getParentId
    });

    return createAppRouteBreadcrumbItems(trail);
}

export function PlaygroundBreadcrumbs(route: PlaygroundRoute): ComposedPlaygroundBreadcrumbs {
    const breadcrumbs = Breadcrumbs({
        className: "playground-breadcrumbs",
        label: "Current playground location",
        items: getBreadcrumbItems(route)
    });

    return Object.assign(breadcrumbs, {
        setRoute(nextRoute: PlaygroundRoute): void {
            breadcrumbs.setItems(getBreadcrumbItems(nextRoute));
        }
    });
}
