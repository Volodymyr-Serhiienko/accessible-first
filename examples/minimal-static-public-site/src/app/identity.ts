import {
    createAppIdentity,
    createAppIdentityDocumentMetadata,
    type AppIdentity,
    type DocumentMetadataStructuredData,
    type DocumentMetadataUpdateOptions
} from "../../../../packages/components/src";
import { appLocalization, t } from "../localization";

export const appBaseUrl = new URL(".", window.location.href);

function createSiteStructuredData(identity: AppIdentity): DocumentMetadataStructuredData {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: identity.name,
        description: identity.description ?? "",
        url: appBaseUrl.toString(),
        inLanguage: appLocalization.getLocale()
    };
}

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
        categories: ["education", "productivity", "utilities"]
    });
}

export function getAppMetadata(): DocumentMetadataUpdateOptions {
    const identity = getAppIdentity();

    return createAppIdentityDocumentMetadata(identity, {
        canonical: appBaseUrl,
        robots: "index,follow",
        structuredData: createSiteStructuredData(identity)
    });
}
