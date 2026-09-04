import { type AppRouteChromeHeaderOptions } from "../../../../packages/components/src";
import {
    appLocalization,
    languageItems,
    t,
    type AppLocale,
    type TemplateMessageKey
} from "../localization";
import { getAppIdentity } from "./identity";

export function getHeaderOptions(): AppRouteChromeHeaderOptions<AppLocale, TemplateMessageKey> {
    return {
        identity: getAppIdentity(),
        locale: appLocalization,
        brand: {
            href: "#main",
            tagline: t("brand.tagline"),
            maxWidth: "24rem",
            logoScale: 1.6,
            logoOffsetY: "0.2rem"
        },
        language: {
            items: languageItems,
            labelOptions: {
                attributes: {
                    "data-af-composition": "visually-hidden"
                }
            }
        },
        theme: {
            display: "button",
            announcement: true
        }
    };
}
