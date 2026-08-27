import {
    createAppIdentityWebAppManifest,
    type WebAppManifest
} from "./af";
import { playgroundAppIdentity } from "./appIdentity";

/**
 * Playground manifest source used by diagnostics.
 *
 * Keep this in sync with public/site.webmanifest until manifest JSON generation
 * becomes part of the project workflow.
 */
export const playgroundManifest: WebAppManifest = createAppIdentityWebAppManifest(playgroundAppIdentity, {
    lang: "en",
    dir: "ltr",
    id: "."
});