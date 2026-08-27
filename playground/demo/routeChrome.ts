import {
    createHashAppRouteChromeRenderer,
    type AppShellCompositionContent,
    type DocumentMetadataUpdateOptions,
    type HashAppRouteChromeBaseOptions,
    type HashRoutedAppChromeRenderer
} from "./af";
import { getPlaygroundHeaderOptions } from "./header";
import {
    playgroundLocale,
    t,
    type PlaygroundLocale,
    type PlaygroundMessageKey
} from "./localization";
import {
    playgroundRoutes,
    type PlaygroundRoute
} from "./routes";

export interface PlaygroundRouteChromeRendererOptions {
    getAppMetadata(): DocumentMetadataUpdateOptions;
    afterOutlet?: AppShellCompositionContent | null;
}

function getPlaygroundRouteChromeOptions(
    options: PlaygroundRouteChromeRendererOptions
): HashAppRouteChromeBaseOptions<PlaygroundRoute, PlaygroundLocale, PlaygroundMessageKey> {
    return {
        routes: playgroundRoutes,
        shell: {
            title: t("app.brand.name"),
            skipLink: t("app.navigation.skipLink"),
            navigationLabel: t("app.navigation.label"),
            metadata: options.getAppMetadata()
        },
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
            searchLocale: playgroundLocale,
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
            searchBoxOptions: {
                searchLocale: playgroundLocale
            },
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

export function createPlaygroundRouteChromeRenderer(
    options: PlaygroundRouteChromeRendererOptions
): HashRoutedAppChromeRenderer<PlaygroundRoute> {
    return createHashAppRouteChromeRenderer<PlaygroundRoute, PlaygroundLocale, PlaygroundMessageKey>({
        options: () => getPlaygroundRouteChromeOptions(options)
    });
}