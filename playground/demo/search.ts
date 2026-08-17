import {
    activateHashRouterRoute,
    RouteSearchBox,
    type ComposedRouteSearchBox,
    type HashRouter
} from "./af";
import type { PlaygroundRoute } from "./routes";

export interface PlaygroundSearchOptions {
    router: HashRouter<PlaygroundRoute>;
    routes: PlaygroundRoute[];
}

export function PlaygroundSearch(
    options: PlaygroundSearchOptions
): ComposedRouteSearchBox<PlaygroundRoute> {
    return RouteSearchBox<PlaygroundRoute>({
        className: "playground-search",
        label: "Search demo sections",
        labelOptions: {
            attributes: {
                "data-af-composition": "visually-hidden"
            }
        },
        placeholder: "Search sections",
        openOnFocus: false,
        notFoundText: "No matching sections found.",
        routes: options.routes,
        searchItemsOptions: {
            getDescription(route) {
                return `Open the ${route.title} section.`;
            },
            getKeywords() {
                return ["component", "demo"];
            }
        },
        onRouteSelect(detail) {
            activateHashRouterRoute(options.router, detail, {
                updateHistory: true,
                scroll: true,
                focusTarget: "outlet"
            });
        }
    });
}
