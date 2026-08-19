import {
    createWebAppManifest,
    type WebAppManifest
} from "./af";

/**
 * Playground manifest source used by diagnostics.
 *
 * Keep this in sync with public/site.webmanifest until manifest JSON generation
 * becomes part of the project workflow.
 */
export const playgroundManifest: WebAppManifest = createWebAppManifest({
    name: "Accessible First Playground",
    shortName: "Accessible First",
    description: "Accessible First Playground demonstrates accessible UI components, semantic composition, routing, search, diagnostics, and app-building patterns.",
    lang: "en",
    dir: "ltr",
    id: ".",
    startUrl: ".",
    scope: ".",
    display: "standalone",
    themeColor: "#111827",
    backgroundColor: "#111827",
    categories: ["developer", "productivity", "accessibility"],
    icons: [
        {
            src: "assets/logo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
        },
        {
            src: "assets/logo-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
        },
        {
            src: "assets/logo-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
        }
    ]
});
