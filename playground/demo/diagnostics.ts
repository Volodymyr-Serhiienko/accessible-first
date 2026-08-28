import { type PublicHashRoutedAppDiagnosticsOptions } from "./af";
import {
    type PlaygroundLocale,
    type PlaygroundMessageKey
} from "./localization";
import { type PlaygroundRoute } from "./routes";

/**
 * Creates diagnostics options for playground page, routes, metadata, manifest, and localization checks.
 */
export function getPlaygroundDiagnosticsOptions(): PublicHashRoutedAppDiagnosticsOptions<
    PlaygroundLocale,
    PlaygroundMessageKey,
    PlaygroundRoute
> {
    return {
        identityManifestOptions: {
            lang: "en",
            dir: "ltr",
            id: "."
        },
        logOnRouteChange: true
    };
}
