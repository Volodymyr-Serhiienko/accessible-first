import {
    createPublicStaticAppTemplate,
    type PublicStaticAppTemplate
} from "../../../../packages/components/src";
import {
    appLocalization,
    type AppLocale,
    type TemplateMessageKey
} from "../localization";
import { HomePage } from "../pages/home";
import { getAppIdentity } from "./identity";
import { getShellOptions } from "./shell";

export type MinimalStaticPublicSite = PublicStaticAppTemplate<AppLocale, TemplateMessageKey>;

export function createMinimalStaticPublicSite(): MinimalStaticPublicSite {
    return createPublicStaticAppTemplate<AppLocale, TemplateMessageKey>({
        mount: "#app",
        identity: getAppIdentity,
        locale: appLocalization,
        shell: getShellOptions,
        content: HomePage,
        diagnostics: {
            pageOptions: {
                landmarks: {
                    requireNavigation: false
                }
            },
            log: true,
            logOnRefresh: true
        }
    });
}
