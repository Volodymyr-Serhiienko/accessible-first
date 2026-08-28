import {
    createLocalizedAppRouteText,
    type AppIdentityRouteDiagnosticsOptions,
    type LocalizedAppRouteText
} from "./af";
import { playgroundAppIdentity } from "./appIdentity";
import {
    playgroundLocale,
    t,
    type PlaygroundMessageKey,
    type PlaygroundRouteMessageKey
} from "./localization";
import { type PlaygroundRoute } from "./routes";

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
    routeLoadedAnnouncementKey: "app.route.loaded",
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
 * Returns the active-locale title for a playground route.
 */
export function getPlaygroundRouteTitle(route: PlaygroundRoute): string {
    return playgroundRouteText.getTitle(route);
}

/**
 * Identity-aware route metadata and diagnostics options for the playground app template.
 */
export const playgroundRouteOptions: AppIdentityRouteDiagnosticsOptions<PlaygroundRoute> = {
    baseUrl: new URL(".", window.location.href),
    ...playgroundRouteText.routeOptions
};
