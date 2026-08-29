import {
    P,
    Stack,
    Strong,
    createAppScreenRoutes,
    type AppScreenRoute,
    type PublicHashRoutedAppRouteMetadataOptions
} from "../../../../packages/components/src";
import { appBaseUrl } from "./identity";

export type MinimalAppRoute = AppScreenRoute;

export const routes = createAppScreenRoutes([
    {
        id: "home",
        title: "Welcome",
        label: "Home",
        description: "A small runnable app shell with brand, theme control, footer, and content.",
        children: [
            Stack(
                P(Strong("Accessible First"), " starts with semantic structure, useful defaults, and room to grow."),
                P("Replace this starter content with your first real screen, then enable more app tools as needed.")
            )
        ]
    }
]);

export const routeMetadata: PublicHashRoutedAppRouteMetadataOptions<MinimalAppRoute> = {
    baseUrl: appBaseUrl
};
