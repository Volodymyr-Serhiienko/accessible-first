import {
    createAppRouteChrome,
    createHashRouterRouteActivationHandler,
    type AppRouteChrome,
    type AppRouteDescriptor,
    type HashRouter
} from "./af";
import { getPlaygroundHeaderOptions } from "./header";
import { playgroundLocale, t, type PlaygroundLocale } from "./localization";
import {
    playgroundRoutes,
    type PlaygroundRoute
} from "./routes";

export interface PlaygroundRouteChromeOptions {
    router: HashRouter<PlaygroundRoute>;
    current: PlaygroundRoute;
}

const playgroundRootRoute: AppRouteDescriptor = {
    id: "playground",
    title: "Accessible First Playground",
    label: "Playground",
    href: "#markup"
};

const playgroundBreadcrumbRoutes: AppRouteDescriptor[] = [
    playgroundRootRoute,
    ...playgroundRoutes
];

function getBreadcrumbParentId(route: AppRouteDescriptor): string | null {
    if (route.id === playgroundRootRoute.id) return null;

    return route.parentId ?? playgroundRootRoute.id;
}

export function createPlaygroundRouteChrome(
    options: PlaygroundRouteChromeOptions
): AppRouteChrome<PlaygroundRoute, PlaygroundLocale> {
    const activateRoute = createHashRouterRouteActivationHandler(options.router, {
        updateHistory: true,
        scroll: true,
        focusTarget: "outlet"
    });

    return createAppRouteChrome<PlaygroundRoute, PlaygroundLocale>({
        routes: playgroundRoutes,
        current: options.current,
        onRouteActivate: activateRoute,
        header: getPlaygroundHeaderOptions("28rem"),
        navigation: {
            id: "playground-navigation",
            className: "playground-nav__inner",
            trigger: t("app.navigation.trigger"),
            triggerIconPosition: "start",
            variant: "pills",
            locale: playgroundLocale
        },
        breadcrumbs: {
            className: "playground-breadcrumbs",
            label: "Current playground location",
            routes: playgroundBreadcrumbRoutes,
            trailOptions: {
                getParentId: getBreadcrumbParentId
            }
        },
        search: {
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
            width: "14rem",
            searchItemsOptions: {
                getDescription(route) {
                    return t("app.route.searchDescription", {
                        title: route.title
                    });
                },
                getKeywords() {
                    return ["component", "demo"];
                }
            }
        },
        commands: {
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
            }
        }
    });
}
