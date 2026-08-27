import {
    FocusRouteLink,
    type ComposedNode,
    type ComposedResponsiveNavigation
} from "./af";
import { t } from "./localization";

export function ReturnToNavigationLink(
    getNavigation: () => ComposedResponsiveNavigation
): ComposedNode {
    return FocusRouteLink({
        className: "playground-return-link",
        href: "#playground-navigation",
        text: t("app.navigation.returnLink"),
        variant: "standalone",
        hint: t("app.navigation.returnHint"),
        hintDisplay: "description",
        focusTarget: () => getNavigation().getFocusTarget(),
        scroll: {
            block: "nearest",
            inline: "nearest",
            behavior: "auto"
        }
    });
}