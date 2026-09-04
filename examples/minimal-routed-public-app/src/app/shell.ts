import { type PublicHashAppTemplateShellOptions } from "../../../../packages/components/src";
import { t } from "../localization";
import { Footer } from "./footer";
import { getAppMetadata } from "./identity";

export function getShellOptions(): PublicHashAppTemplateShellOptions {
    return {
        title: () => t("app.name"),
        skipLink: () => t("shell.skipLink"),
        navigationLabel: () => t("shell.navigationLabel"),
        metadata: getAppMetadata,
        outletOptions: () => ({
            label: t("shell.contentLabel"),
            announcement: false,
            scrollOnRender: true
        }),
        footer: () => Footer(),
        layout: {
            chrome: {
                header: "normal",
                navigation: "reveal",
                beforeOutlet: "sticky"
            },
            maxWidth: "64rem",
            gutter: "clamp(1rem, 5vw, 2rem)",
            mainGap: "1rem"
        }
    };
}
