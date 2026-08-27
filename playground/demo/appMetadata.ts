import {
    createAppDocumentMetadata,
    type DocumentMetadataUpdateOptions
} from "./af";
import { playgroundAppIdentity } from "./appIdentity";
import { playgroundLocale, t } from "./localization";

/**
 * Creates document metadata for the playground app shell from the shared app identity.
 */
export function getPlaygroundAppMetadata(): DocumentMetadataUpdateOptions {
    const appUrl = new URL(".", window.location.href);
    const previewImageUrl = new URL(playgroundAppIdentity.icons.png512, window.location.href);

    return createAppDocumentMetadata({
        name: t("app.brand.name"),
        lang: playgroundLocale.getLocale(),
        description: playgroundAppIdentity.description,
        themeColor: playgroundAppIdentity.themeColor,
        url: appUrl,
        robots: "index, follow",
        manifest: playgroundAppIdentity.manifestHref,
        icons: [
            {
                href: playgroundAppIdentity.icons.svg,
                type: "image/svg+xml"
            }
        ],
        image: {
            url: previewImageUrl,
            type: "image/png",
            width: 512,
            height: 512,
            alt: playgroundAppIdentity.logoAlt
        },
        openGraph: {
            description: playgroundAppIdentity.socialDescription
        },
        twitter: {
            description: playgroundAppIdentity.twitterDescription
        },
        softwareApplication: {
            name: playgroundAppIdentity.name,
            description: playgroundAppIdentity.softwareDescription,
            applicationCategory: playgroundAppIdentity.softwareApplication.applicationCategory,
            operatingSystem: playgroundAppIdentity.softwareApplication.operatingSystem
        }
    });
}
