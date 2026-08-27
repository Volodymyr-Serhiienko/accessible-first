import {
    createAppWebAppManifest,
    type WebAppManifest
} from "./af";
import { playgroundAppIdentity } from "./appIdentity";

/**
 * Playground manifest source used by diagnostics.
 *
 * Keep this in sync with public/site.webmanifest until manifest JSON generation
 * becomes part of the project workflow.
 */
export const playgroundManifest: WebAppManifest = createAppWebAppManifest({
    name: playgroundAppIdentity.name,
    shortName: playgroundAppIdentity.shortName,
    description: playgroundAppIdentity.description,
    lang: "en",
    dir: "ltr",
    id: ".",
    themeColor: playgroundAppIdentity.themeColor,
    categories: playgroundAppIdentity.categories,
    iconSet: {
        svg: playgroundAppIdentity.icons.svg,
        png192: playgroundAppIdentity.icons.png192,
        png512: playgroundAppIdentity.icons.png512
    }
});
