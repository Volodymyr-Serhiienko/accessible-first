import { type PublicHashAppTemplateRouteChromeBaseOptions } from "../../../../packages/components/src";
import {
    t,
    type AppLocale,
    type TemplateMessageKey
} from "../localization";
import { getHeaderOptions } from "./header";
import type { MinimalAppRoute } from "./routes";

export function getChromeOptions(): PublicHashAppTemplateRouteChromeBaseOptions<
    MinimalAppRoute,
    AppLocale,
    TemplateMessageKey
> {
    return {
        header: getHeaderOptions(),
        navigation: {
            id: "app-navigation"
        },
        breadcrumbs: {},
        navigationReturnLink: {
            href: "#app-navigation",
            text: t("navigation.returnLink"),
            variant: "standalone",
            scroll: true
        }
    };
}
