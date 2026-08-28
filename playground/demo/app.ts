import {
    createPublicAppTemplate,
    type PublicHashAppTemplate
} from "./af";
import { playgroundAppIdentity } from "./appIdentity";
import { getPlaygroundDiagnosticsOptions } from "./diagnostics";
import {
    playgroundLocale,
    type PlaygroundLocale,
    type PlaygroundMessageKey
} from "./localization";
import { getPlaygroundRouteChromeOptions } from "./routeChrome";
import {
    playgroundRouteOptions,
    playgroundRouteText
} from "./routeText";
import {
    playgroundRoutes,
    type PlaygroundRoute
} from "./routes";
import { getPlaygroundShellOptions } from "./shell";
import { notifications } from "./status";

export type PlaygroundApp = PublicHashAppTemplate<PlaygroundRoute>;

/**
 * Creates the playground as a real Accessible First app using the public app template.
 */
export function createPlaygroundApp(): PlaygroundApp {
    return createPublicAppTemplate<PlaygroundRoute, PlaygroundLocale, PlaygroundMessageKey>({
        routes: playgroundRoutes,
        mount: "#app",
        locale: playgroundLocale,
        identity: playgroundAppIdentity,
        routeMetadata: playgroundRouteOptions,
        shell: getPlaygroundShellOptions(),
        router: {
            getAnnouncement: playgroundRouteText.getLoadedAnnouncement
        },
        routeChrome: () => getPlaygroundRouteChromeOptions({
            afterOutlet: notifications
        }),
        diagnostics: getPlaygroundDiagnosticsOptions()
    });
}