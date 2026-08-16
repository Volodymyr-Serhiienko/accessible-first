import {
    Breadcrumbs,
    createAppRouteBreadcrumbItems,
    type ComposedBreadcrumbs
} from "./af";
import type { PlaygroundRoute } from "./routes";

export interface ComposedPlaygroundBreadcrumbs extends ComposedBreadcrumbs {
    setRoute(route: PlaygroundRoute): void;
}

const playgroundRootRoute = {
    id: "playground",
    title: "Accessible First Playground",
    label: "Playground",
    href: "#buttons"
};

function getBreadcrumbItems(route: PlaygroundRoute) {
    return createAppRouteBreadcrumbItems([
        playgroundRootRoute,
        route
    ]);
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
