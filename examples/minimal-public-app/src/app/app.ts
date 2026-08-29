import {
    createPublicAppTemplate,
    type PublicHashAppTemplate
} from "../../../../packages/components/src";
import { getDiagnosticsOptions } from "./diagnostics";
import { appIdentity } from "./identity";
import { getRouteChromeOptions } from "./routeChrome";
import { routeMetadata, routes, type MinimalAppRoute } from "./routes";
import { getShellOptions } from "./shell";

export function createMinimalPublicApp(): PublicHashAppTemplate<MinimalAppRoute> {
    return createPublicAppTemplate<MinimalAppRoute>({
        routes,
        mount: "#app",
        identity: appIdentity,
        routeMetadata,
        shell: getShellOptions(),
        routeChrome: getRouteChromeOptions(),
        diagnostics: getDiagnosticsOptions()
    });
}
