import { type PublicHashAppTemplateShellOptions } from "./af";
import { getPlaygroundAppMetadata } from "./appMetadata";
import { FooterDemo } from "./footer";
import { t } from "./localization";

/**
 * Creates app shell options for the playground public app template.
 */
export function getPlaygroundShellOptions(): PublicHashAppTemplateShellOptions {
    return {
        title: () => t("app.brand.name"),
        skipLink: () => t("app.navigation.skipLink"),
        skipLinkTargetId: "playground-navigation",
        navigationLabel: () => t("app.navigation.label"),
        metadata: getPlaygroundAppMetadata,
        footer: FooterDemo(),
        outletOptions: () => ({
            className: "playground-route-outlet",
            label: t("app.route.outletLabel"),
            announcement: false,
            scrollOnRender: true
        }),
        layout: {
            maxWidth: "var(--playground-max-width)",
            gutter: "var(--playground-gutter)",
            chrome: {
                header: "normal",
                navigation: "reveal",
                beforeOutlet: "sticky"
            },
            mainGap: "1rem",
            mainPaddingBlock: "1rem 2rem"
        }
    };
}
