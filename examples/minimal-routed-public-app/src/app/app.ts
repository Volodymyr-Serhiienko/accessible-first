import {
    createPublicAppTemplate,
    type PublicHashAppTemplate
} from "../../../../packages/components/src";
import {
    appLocalization,
    type AppLocale,
    type TemplateMessageKey
} from "../localization";
import { getChromeOptions } from "./chrome";
import { getDiagnosticsOptions } from "./diagnostics";
import { getAppIdentity } from "./identity";
import { routeText } from "./routeText";
import { routeMetadata, routes, type MinimalAppRoute } from "./routes";
import { getShellOptions } from "./shell";

export function createMinimalRoutedPublicApp(): PublicHashAppTemplate<MinimalAppRoute> {
    return createPublicAppTemplate<MinimalAppRoute, AppLocale, TemplateMessageKey>({
        mode: "hash",
        routes,
        mount: "#app",
        locale: appLocalization,
        identity: getAppIdentity(),
        routeText,
        routeMetadata,
        shell: getShellOptions(),
        routeChrome: getChromeOptions,
        diagnostics: getDiagnosticsOptions()
    });
}
