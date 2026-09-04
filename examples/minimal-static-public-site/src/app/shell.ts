import type { PublicStaticAppTemplateShellOptions } from "../../../../packages/components/src";
import { t } from "../localization";
import { Footer } from "./footer";
import { Header } from "./header";
import { getAppMetadata } from "./identity";

export function getShellOptions(): PublicStaticAppTemplateShellOptions {
    return {
        title: t("app.name"),
        skipLink: t("shell.skipLink"),
        metadata: getAppMetadata,
        header: Header,
        footer: Footer,
        outletOptions: {
            label: t("shell.contentLabel"),
            announcement: false,
            scrollOnRender: false
        },
        layout: {
            chrome: "normal",
            maxWidth: "64rem",
            gutter: "clamp(1rem, 5vw, 2rem)",
            mainGap: "1rem"
        }
    };
}
