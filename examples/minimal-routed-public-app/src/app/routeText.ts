import { createLocalizedAppRouteText } from "../../../../packages/components/src";
import {
    appLocalization,
    type AppMessageKey
} from "../localization";
import type { MinimalAppRoute } from "./routes";

export const routeText = createLocalizedAppRouteText<MinimalAppRoute, AppMessageKey>({
    locale: appLocalization,
    routeLoadedAnnouncementKey: "route.loadedAnnouncement"
});
