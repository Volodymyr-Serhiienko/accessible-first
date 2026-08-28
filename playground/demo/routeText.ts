import {
    createLocalizedAppRouteText,
    type AppIdentityRouteDiagnosticsOptions,
    type AppRouteBreadcrumbItemsOptions,
    type AppRouteDescriptor,
    type LocalizedAppRouteText
} from "./af";
import { playgroundAppIdentity } from "./appIdentity";
import {
    playgroundLocale,
    t,
    type PlaygroundMessageKey,
    type PlaygroundRouteMessageKey
} from "./localization";
import {
    getPlaygroundRouteById,
    type PlaygroundRoute
} from "./routes";

function getPlaygroundRouteTitleKey(route: PlaygroundRoute): PlaygroundRouteMessageKey {
    return `routes.${route.id}.title`;
}

/**
 * Localized route text shared by navigation, search, breadcrumbs, announcements, metadata, and diagnostics.
 */
export const playgroundRouteText: LocalizedAppRouteText<PlaygroundRoute> = createLocalizedAppRouteText<
    PlaygroundRoute,
    PlaygroundMessageKey
>({
    locale: playgroundLocale,
    getKeys(route) {
        const titleKey = getPlaygroundRouteTitleKey(route);

        return {
            title: titleKey,
            label: titleKey,
            description: route.description ? null : "app.route.description",
            documentTitle: titleKey
        };
    },
    getParams(route) {
        return {
            appName: playgroundAppIdentity.name,
            title: t(getPlaygroundRouteTitleKey(route))
        };
    }
});

/**
 * Breadcrumb label resolver widened for the synthetic playground root route.
 */
export const playgroundBreadcrumbItemsOptions: AppRouteBreadcrumbItemsOptions<AppRouteDescriptor> = {
    getLabel(route) {
        const playgroundRoute = getPlaygroundRouteById(route.id);

        return playgroundRoute ? playgroundRouteText.getLabel(playgroundRoute) : route.label ?? route.title;
    }
};

/**
 * Returns the active-locale title for a playground route.
 */
export function getPlaygroundRouteTitle(route: PlaygroundRoute): string {
    return playgroundRouteText.getTitle(route);
}

/**
 * Returns the active-locale route description used by metadata and diagnostics.
 */
export function getPlaygroundRouteDescription(route: PlaygroundRoute): string {
    return playgroundRouteText.getDescription(route)
        ?? t("app.route.description", {
            appName: playgroundAppIdentity.name,
            title: getPlaygroundRouteTitle(route)
        });
}

/**
 * Identity-aware route metadata and diagnostics options for the playground app template.
 */
export const playgroundRouteOptions: AppIdentityRouteDiagnosticsOptions<PlaygroundRoute> = {
    baseUrl: new URL(".", window.location.href),
    getTitle: playgroundRouteText.getDocumentTitle,
    getDocumentTitle: playgroundRouteText.getDocumentTitle,
    getDescription: getPlaygroundRouteDescription
};