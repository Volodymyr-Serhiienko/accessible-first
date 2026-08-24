import {
    activateHashRouterRoute,
    RouteSearchBox,
    type ComposedRouteSearchBox,
    type HashRouter
} from "./af";
import { t } from "./localization";
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
        label: t("app.search.label"),
        labelOptions: {
            attributes: {
                "data-af-composition": "visually-hidden"
            }
        },
        placeholder: t("app.search.placeholder"),
        openOnFocus: false,
        notFoundText: t("app.search.notFoundText"),
        routes: options.routes,
        searchItemsOptions: {
            getDescription(route) {
                return t("app.route.searchDescription", {
                    title: route.title
                });
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
