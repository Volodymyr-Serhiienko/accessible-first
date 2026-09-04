import {
    createAppIdentity,
    createAppIdentityDocumentMetadata,
    type AppIdentity
} from "../../../../packages/components/src";
import { appLocalization, t } from "../localization";

export const appBaseUrl = new URL(".", window.location.href);

export function getAppIdentity(): AppIdentity {
    const logoAlt = t("app.logoAlt");

    return createAppIdentity({
        name: t("app.name"),
        shortName: t("app.shortName"),
        description: t("app.description"),
        lang: appLocalization.getLocale(),
        url: appBaseUrl,
        themeColor: "#101820",
        backgroundColor: "#101820",
        manifestHref: "site.webmanifest",
        logoAlt,
        icons: {
            svg: "assets/logo.svg",
            png192: "assets/logo-192.png",
            png512: "assets/logo-512.png",
            preview: {
                url: "assets/logo-512.png",
                type: "image/png",
                width: 512,
                height: 512,
                alt: logoAlt
            }
        },
        categories: ["productivity", "utilities"],
        softwareApplication: {
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web"
        }
    });
}

export function getAppMetadata() {
    return createAppIdentityDocumentMetadata(getAppIdentity(), {
        robots: "index,follow"
    });
}
