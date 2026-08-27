import { createAppIdentity } from "./af";

/**
 * Playground-owned public app identity shared by metadata, manifest, routes, and localized chrome.
 */
export const playgroundAppIdentity = createAppIdentity({
    name: "Accessible First Playground",
    shortName: "Accessible First",
    description: "Accessible First Playground demonstrates accessible UI components, semantic composition, routing, search, diagnostics, and app-building patterns.",
    socialDescription: "Accessible First Playground demonstrates WCAG-first UI components and app-building patterns.",
    twitterDescription: "WCAG-first components, semantic composition, routing, diagnostics, and app-building patterns.",
    softwareDescription: "Accessible First Playground demonstrates WCAG-first UI components, semantic composition, routing, diagnostics, and app-building patterns.",
    themeColor: "#111827",
    manifestHref: "site.webmanifest",
    logoAlt: "Accessible First AF logo",
    icons: {
        svg: "assets/logo.svg",
        png192: "assets/logo-192.png",
        png512: "assets/logo-512.png"
    },
    categories: ["developer", "productivity", "accessibility"],
    softwareApplication: {
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web"
    }
});