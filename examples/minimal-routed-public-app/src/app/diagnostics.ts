import { type PublicHashRoutedAppDiagnosticsOptions } from "../../../../packages/components/src";
import {
    appLocalization,
    type AppLocale,
    type TemplateMessageKey
} from "../localization";
import { getAppIdentity } from "./identity";
import type { MinimalAppRoute } from "./routes";

export function getDiagnosticsOptions(): PublicHashRoutedAppDiagnosticsOptions<
    AppLocale,
    TemplateMessageKey,
    MinimalAppRoute
> {
    return {
        logOnRouteChange: true,
        identity: getAppIdentity,
        locale: appLocalization
    };
}
