import {
    activateHashRouterRoute,
    RouteSearchBox,
    type ComposedRouteSearchBox,
    type HashRouter,
    type RouteSearchBoxOptions
} from "./af";
import { t } from "./localization";
import type { PlaygroundRoute } from "./routes";

export interface PlaygroundSearchOptions {
    router: HashRouter<PlaygroundRoute>;
    routes: PlaygroundRoute[];
    width?: string | null;
    minWidth?: string | null;
    maxWidth?: string | null;
}

export function PlaygroundSearch(
    options: PlaygroundSearchOptions
): ComposedRouteSearchBox<PlaygroundRoute> {
    const searchOptions: RouteSearchBoxOptions<PlaygroundRoute> = {
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
    };

    if ("width" in options) searchOptions.width = options.width ?? null;
    if ("minWidth" in options) searchOptions.minWidth = options.minWidth ?? null;
    if ("maxWidth" in options) searchOptions.maxWidth = options.maxWidth ?? null;

    return RouteSearchBox<PlaygroundRoute>(searchOptions);
}
