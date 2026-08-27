import {
    createAppDiagnosticsRunner,
    createHashRoutedApp,
    inspectAppRoutes,
    inspectLocaleController,
    inspectWebAppManifest,
    resetInitialScrollPosition,
    type ComposedResponsiveNavigation,
    type HashRoutedApp
} from "./demo/af";
import { FooterDemo } from "./demo/footer";
import { getPlaygroundAppMetadata } from "./demo/appMetadata";
import { playgroundLocale, playgroundRequiredMessageKeys, t } from "./demo/localization";
import { playgroundManifest } from "./demo/manifest";
import { ReturnToNavigationLink } from "./demo/returnToNavigation";
import { createPlaygroundRouteChromeRenderer } from "./demo/routeChrome";
import {
    getPlaygroundRouteDescription,
    getPlaygroundRouteDocumentMetadata,
    getPlaygroundRouteDocumentTitle,
    playgroundRoutes,
    type PlaygroundRoute
} from "./demo/routes";
import { notifications } from "./demo/status";

import "../packages/components/src/styles/index.css";

const routeDiagnostics = inspectAppRoutes(playgroundRoutes, {
    baseUrl: new URL(".", window.location.href),
    getDescription: getPlaygroundRouteDescription,
    getDocumentTitle: getPlaygroundRouteDocumentTitle,
    getMetadata: getPlaygroundRouteDocumentMetadata,
    requireDescription: true,
    requireDocumentTitle: true,
    requireCanonical: true,
    requireStructuredData: true
});

let app!: HashRoutedApp<PlaygroundRoute>;
let currentNavigation!: ComposedResponsiveNavigation;

const playgroundDiagnostics = createAppDiagnosticsRunner({
    page: () => app.shell.inspect({
        log: false,
        documentMetadata: {
            requireDescription: true,
            requireCanonical: true,
            requireRobots: true,
            requireManifest: true,
            requireOpenGraph: true,
            requireTwitter: true,
            requireStructuredData: true
        }
    }),
    routes: routeDiagnostics,
    sources: () => [
        {
            id: "localization",
            label: "Localization",
            report: inspectLocaleController(playgroundLocale, {
                requiredMessages: playgroundRequiredMessageKeys
            })
        },
        {
            id: "manifest",
            label: "Web App Manifest",
            report: inspectWebAppManifest(playgroundManifest, {
                requireShortName: true,
                requireDescription: true,
                requireStartUrl: true,
                requireDisplay: true,
                requireIcons: true,
                requireThemeColor: true,
                requireBackgroundColor: true,
                requireMaskableIcon: true
            })
        }
    ]
});

function logPlaygroundDiagnostics(): void {
    playgroundDiagnostics.log();
}

app = createHashRoutedApp<PlaygroundRoute>({
    routes: playgroundRoutes,
    mount: "#app",
    start: false,
    locale: playgroundLocale,
    shell: {
        title: t("app.brand.name"),
        mainId: "main",
        skipLink: t("app.navigation.skipLink"),
        skipLinkTargetId: "playground-navigation",
        navigationLabel: t("app.navigation.label"),
        locale: playgroundLocale,
        theme: "system",
        metadata: getPlaygroundAppMetadata(),
        afterOutlet: [
            ReturnToNavigationLink(() => currentNavigation),
            notifications
        ],
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
        getDocumentTitle: getPlaygroundRouteDocumentTitle,
        getDocumentMetadata(route) {
            return getPlaygroundRouteDocumentMetadata(route);
        },
        getAnnouncement(route) {
            return t("app.route.loaded", {
                title: route.title
            });
        },
        inspect() {
            logPlaygroundDiagnostics();
        }
    },
    renderChrome: createPlaygroundRouteChromeRenderer({
        getAppMetadata: getPlaygroundAppMetadata,
        onNavigation(navigation) {
            currentNavigation = navigation;
        }
    })
});

app.start({
    announcement: false,
    scroll: false,
    focusTarget: null
});

resetInitialScrollPosition();
