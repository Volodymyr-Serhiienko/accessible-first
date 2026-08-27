import {
    createAppDiagnosticsRunner,
    createAppDocumentMetadata,
    createHashRoutedApp,
    inspectAppRoutes,
    inspectLocaleController,
    inspectWebAppManifest,
    resetInitialScrollPosition,
    type ComposedResponsiveNavigation,
    type DocumentMetadataUpdateOptions,
    type HashRoutedApp
} from "./demo/af";
import { FooterDemo } from "./demo/footer";
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

function getPlaygroundAppMetadata(): DocumentMetadataUpdateOptions {
    const appUrl = new URL(".", window.location.href);
    const previewImageUrl = new URL("assets/logo-512.png", window.location.href);

    return createAppDocumentMetadata({
        name: t("app.brand.name"),
        lang: playgroundLocale.getLocale(),
        description: "Accessible First Playground demonstrates accessible UI components, semantic composition, routing, search, and app-building patterns.",
        themeColor: "#111827",
        url: appUrl,
        robots: "index, follow",
        manifest: "site.webmanifest",
        icons: [
            {
                href: "assets/logo.svg",
                type: "image/svg+xml"
            }
        ],
        image: {
            url: previewImageUrl,
            type: "image/png",
            width: 512,
            height: 512,
            alt: "Accessible First AF logo"
        },
        openGraph: {
            description: "Accessible First Playground demonstrates WCAG-first UI components and app-building patterns."
        },
        twitter: {
            description: "WCAG-first components, semantic composition, routing, diagnostics, and app-building patterns."
        },
        softwareApplication: {
            name: "Accessible First Playground",
            description: "Accessible First Playground demonstrates WCAG-first UI components, semantic composition, routing, diagnostics, and app-building patterns.",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web"
        }
    });
}
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
