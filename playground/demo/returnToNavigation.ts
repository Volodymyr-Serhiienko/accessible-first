import {
    ResponsiveNavigationFocusLink,
    type ComposedNode,
    type ComposedResponsiveNavigation
} from "./af";
import { t } from "./localization";

export function ReturnToNavigationLink(
    getNavigation: () => ComposedResponsiveNavigation
): ComposedNode {
    return ResponsiveNavigationFocusLink({
        className: "playground-return-link",
        href: "#playground-navigation",
        text: t("app.navigation.returnLink"),
        variant: "standalone",
        hint: t("app.navigation.returnHint"),
        hintDisplay: "description",
        navigation: getNavigation,
        scroll: {
            block: "nearest",
            inline: "nearest",
            behavior: "auto"
        }
    });
}