import {
    activateHashRouterRoute,
    RouteCommandPalette,
    type ComposedRouteCommandPalette,
    type HashRouter
} from "./af";
import type { PlaygroundRoute } from "./routes";

export interface PlaygroundCommandsOptions {
    router: HashRouter<PlaygroundRoute>;
    routes: PlaygroundRoute[];
}

export function PlaygroundCommands(
    options: PlaygroundCommandsOptions
): ComposedRouteCommandPalette<PlaygroundRoute> {
    return RouteCommandPalette<PlaygroundRoute>({
        trigger: "Commands",
        title: "Playground commands",
        description: "Search demo sections and press Enter to open the selected section.",
        searchLabel: "Search playground commands",
        placeholder: "Search commands",
        notFoundText: "No commands found.",
        shortcut: [
            { key: "k", ctrlKey: true, allowInEditable: true },
            { key: "k", metaKey: true, allowInEditable: true }
        ],
        routes: options.routes,
        searchItemsOptions: {
            getDescription(route) {
                return `Open the ${route.title} demo section.`;
            },
            getKeywords(route) {
                return ["open", "go", "section", "demo", route.id, route.title, route.label];
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
