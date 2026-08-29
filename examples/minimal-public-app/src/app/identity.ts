import { createAppIdentity } from "../../../../packages/components/src";

export const appBaseUrl = new URL(".", window.location.href);
export const appDescription = "A minimal Accessible First application template with semantic structure, metadata, theme, footer, and content.";
export const appLogoAlt = "Accessible First app logo";

export const appIdentity = createAppIdentity({
    name: "Accessible First App",
    shortName: "AF App",
    description: appDescription,
    lang: "en",
    url: appBaseUrl,
    themeColor: "#101820",
    backgroundColor: "#101820",
    manifestHref: "site.webmanifest",
    logoAlt: appLogoAlt,
    icons: {
        svg: "assets/logo.svg",
        png192: "assets/logo-192.png",
        png512: "assets/logo-512.png",
        preview: {
            url: "assets/logo-512.png",
            type: "image/png",
            width: 512,
            height: 512,
            alt: appLogoAlt
        }
    },
    categories: ["productivity", "utilities"],
    softwareApplication: {
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web"
    }
});
