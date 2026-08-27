import {
    createPublicHashRoutedApp,
    type PublicHashRoutedApp
} from "./demo/af";
import { FooterDemo } from "./demo/footer";
import { getPlaygroundAppMetadata } from "./demo/appMetadata";
import { playgroundAppIdentity } from "./demo/appIdentity";
import {
    playgroundLocale,
    playgroundRequiredMessageKeys,
    t,
    type PlaygroundLocale,
    type PlaygroundMessageKey
} from "./demo/localization";
import { createPlaygroundRouteChromeRenderer } from "./demo/routeChrome";
import {
    playgroundRouteOptions,
    playgroundRoutes,
    type PlaygroundRoute
} from "./demo/routes";
import { notifications } from "./demo/status";

import "../packages/components/src/styles/index.css";

let app!: PublicHashRoutedApp<PlaygroundRoute>;

app = createPublicHashRoutedApp<PlaygroundRoute, PlaygroundLocale, PlaygroundMessageKey>({
    routes: playgroundRoutes,
    mount: "#app",
    locale: playgroundLocale,
    identity: playgroundAppIdentity,
    routeMetadata: playgroundRouteOptions,
    shell: {
        title: t("app.brand.name"),
        mainId: "main",
        skipLink: t("app.navigation.skipLink"),
        skipLinkTargetId: "playground-navigation",
        navigationLabel: t("app.navigation.label"),
        locale: playgroundLocale,
        theme: "system",
        metadata: getPlaygroundAppMetadata(),
        footer: FooterDemo(),
        outletOptions: {
            className: "playground-route-outlet",
            label: "Playground demo content",
            announcement: false,
            scrollOnRender: true
        },
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
    },
    router: {
        getAnnouncement(route) {
            return t("app.route.loaded", {
                title: route.title
            });
        }
    },
    renderChrome: createPlaygroundRouteChromeRenderer({
        getAppMetadata: getPlaygroundAppMetadata,
        afterOutlet: notifications
    }),
    diagnostics: {
        identityManifestOptions: {
            lang: "en",
            dir: "ltr",
            id: "."
        },
        locale: playgroundLocale,
        localeOptions: {
            requiredMessages: playgroundRequiredMessageKeys
        },
        logOnRouteChange: true
    },
    startOptions: {
        announcement: false,
        scroll: false,
        focusTarget: null
    }
});
