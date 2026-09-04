import {
    createAppScreenRoutes,
    type AppRouteLocaleTextRoute,
    type AppScreenRoute,
    type PublicHashRoutedAppRouteMetadataOptions
} from "../../../../packages/components/src";
import { type AppMessageKey, t } from "../localization";
import { AboutPage } from "../pages/about";
import { HomePage } from "../pages/home";
import { appBaseUrl } from "./identity";

interface MinimalAppRouteExtension extends AppRouteLocaleTextRoute<AppMessageKey> {}

export type MinimalAppRoute = AppScreenRoute<MinimalAppRouteExtension>;

export const routes = createAppScreenRoutes<MinimalAppRouteExtension>([
    {
        id: "home",
        title: "Welcome",
        label: "Home",
        description: "A small runnable app shell with brand, theme control, localization, navigation, breadcrumbs, footer, and content sections.",
        keywords: ["starter", "template", "home", "localization", "sections"],
        localeKeys: {
            title: "routes.home.title",
            label: "routes.home.label",
            description: "routes.home.description",
            keywords: ["routes.home.keywords"]
        },
        screen: {
            title: () => t("routes.home.title"),
            description: () => t("routes.home.description")
        },
        children: HomePage
    },
    {
        id: "about",
        title: "About This Template",
        label: "About",
        parentId: "home",
        description: "A second route that demonstrates routed content, localized page sections, metadata, active navigation, and breadcrumbs.",
        keywords: ["about", "routing", "breadcrumbs", "navigation", "localization", "sections"],
        localeKeys: {
            title: "routes.about.title",
            label: "routes.about.label",
            description: "routes.about.description",
            keywords: ["routes.about.keywords"]
        },
        screen: {
            title: () => t("routes.about.title"),
            description: () => t("routes.about.description")
        },
        children: AboutPage
    }
]);

export const routeMetadata: PublicHashRoutedAppRouteMetadataOptions<MinimalAppRoute> = {
    baseUrl: appBaseUrl
};
