import {
    type AppShellCompositionContent,
    type PublicHashAppTemplateRouteChromeBaseOptions
} from "./af";
import { getPlaygroundHeaderOptions } from "./header";
import {
    t,
    type PlaygroundLocale,
    type PlaygroundMessageKey
} from "./localization";
import {
    getPlaygroundRouteTitle,
    playgroundRouteText
} from "./routeText";
import { type PlaygroundRoute } from "./routes";

export interface PlaygroundRouteChromeOptions {
    afterOutlet?: AppShellCompositionContent | null;
}

export function getPlaygroundRouteChromeOptions(
    options: PlaygroundRouteChromeOptions = {}
): PublicHashAppTemplateRouteChromeBaseOptions<PlaygroundRoute, PlaygroundLocale, PlaygroundMessageKey> {
    return {
        header: getPlaygroundHeaderOptions("28rem"),
        navigation: {
            id: "playground-navigation",
            className: "playground-nav__inner",
            trigger: t("app.navigation.trigger"),
            triggerIconPosition: "start",
            variant: "pills"
        },
        breadcrumbs: {
            className: "playground-breadcrumbs",
            label: t("breadcrumbs.label"),
            root: {
                id: "playground",
                title: t("app.breadcrumbs.rootLabel"),
                label: t("app.breadcrumbs.rootLabel"),
                href: "#markup"
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
                        title: getPlaygroundRouteTitle(route)
                    });
                },
                getKeywords(route) {
                    return [
                        ...playgroundRouteText.getKeywords(route),
                        "component",
                        "demo"
                    ];
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
            searchItemsOptions: {
                getDescription(route) {
                    return t("app.route.commandDescription", {
                        title: getPlaygroundRouteTitle(route)
                    });
                },
                getKeywords(route) {
                    return [
                        ...playgroundRouteText.getKeywords(route),
                        "open",
                        "go",
                        "section",
                        "demo",
                        route.id
                    ];
                }
            }
        },
        navigationReturnLink: {
            className: "playground-return-link",
            href: "#playground-navigation",
            text: t("app.navigation.returnLink"),
            variant: "standalone",
            hint: t("app.navigation.returnHint"),
            hintDisplay: "description",
            scroll: {
                block: "nearest",
                inline: "nearest",
                behavior: "auto"
            }
        },
        afterOutlet: options.afterOutlet
    };
}
