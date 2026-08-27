import {
    createAppIdentityDocumentMetadata,
    type DocumentMetadataUpdateOptions
} from "./af";
import { playgroundAppIdentity } from "./appIdentity";
import { playgroundLocale, t } from "./localization";

/**
 * Creates document metadata for the playground app shell from the shared app identity.
 */
export function getPlaygroundAppMetadata(): DocumentMetadataUpdateOptions {
    const appUrl = new URL(".", window.location.href);
    const previewImageUrl = new URL(playgroundAppIdentity.icons.png512 ?? "assets/logo-512.png", window.location.href);

    return createAppIdentityDocumentMetadata(playgroundAppIdentity, {
        name: t("app.brand.name"),
        lang: playgroundLocale.getLocale(),
        url: appUrl,
        robots: "index, follow",
        image: {
            url: previewImageUrl,
            type: "image/png",
            width: 512,
            height: 512,
            alt: playgroundAppIdentity.logoAlt
        }
    });
}