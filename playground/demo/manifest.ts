import {
    createAppWebAppManifest,
    type WebAppManifest
} from "./af";

/**
 * Playground manifest source used by diagnostics.
 *
 * Keep this in sync with public/site.webmanifest until manifest JSON generation
 * becomes part of the project workflow.
 */
export const playgroundManifest: WebAppManifest = createAppWebAppManifest({
    name: "Accessible First Playground",
    shortName: "Accessible First",
    description: "Accessible First Playground demonstrates accessible UI components, semantic composition, routing, search, diagnostics, and app-building patterns.",
    lang: "en",
    dir: "ltr",
    id: ".",
    themeColor: "#111827",
    categories: ["developer", "productivity", "accessibility"],
    iconSet: {
        svg: "assets/logo.svg",
        png192: "assets/logo-192.png",
        png512: "assets/logo-512.png"
    }
});
