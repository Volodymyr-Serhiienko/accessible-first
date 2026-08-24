import {
    activateHashRouterRoute,
    RouteCommandPalette,
    type ComposedRouteCommandPalette,
    type HashRouter
} from "./af";
import { playgroundLocale, t } from "./localization";
import type { PlaygroundRoute } from "./routes";

export interface PlaygroundCommandsOptions {
    router: HashRouter<PlaygroundRoute>;
    routes: PlaygroundRoute[];
}

export function PlaygroundCommands(
    options: PlaygroundCommandsOptions
): ComposedRouteCommandPalette<PlaygroundRoute> {
    return RouteCommandPalette<PlaygroundRoute>({
        trigger: t("app.commands.trigger"),
        title: t("app.commands.title"),
        description: t("app.commands.description"),
        searchLabel: t("app.commands.searchLabel"),
        placeholder: t("app.commands.placeholder"),
        notFoundText: t("app.commands.notFoundText"),
        shortcut: [
            { key: "k", code: "KeyK", ctrlKey: true, allowInEditable: true },
            { key: "k", code: "KeyK", metaKey: true, allowInEditable: true }
        ],
        routes: options.routes,
        locale: playgroundLocale,
        searchItemsOptions: {
            getDescription(route) {
                return t("app.route.commandDescription", {
                    title: route.title
                });
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
