import {
    createAppDiagnosticsReport,
    createHashRoutedApp,
    inspectAppRoutes,
    inspectWebAppManifest,
    logAppDiagnostics,
    type ComposedResponsiveNavigation,
    type DocumentMetadataUpdateOptions,
    type HashRoutedApp
} from "./demo/af";
import { FooterDemo } from "./demo/footer";
import { playgroundLocale, t } from "./demo/localization";
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

function scrollToPageStart(): void {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto"
    });
}

function scheduleInitialPageScroll(): void {
    if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
    }

    scrollToPageStart();

    window.requestAnimationFrame(() => {
        scrollToPageStart();

        window.requestAnimationFrame(() => {
            scrollToPageStart();
        });
    });
}

function getPlaygroundAppMetadata(): DocumentMetadataUpdateOptions {
    return {
        lang: playgroundLocale.getLocale(),
        description: "Accessible First Playground demonstrates accessible UI components, semantic composition, routing, search, and app-building patterns.",
        themeColor: "#111827",
        canonical: new URL(".", window.location.href),
        robots: "index, follow",
        manifest: "site.webmanifest",
        icons: [
            {
                href: "assets/logo.svg",
                type: "image/svg+xml"
            }
        ],
        openGraph: {
            title: t("app.brand.name"),
            type: "website",
            url: new URL(".", window.location.href),
            description: "Accessible First Playground demonstrates WCAG-first UI components and app-building patterns.",
            siteName: "Accessible First",
            image: {
                url: new URL("assets/logo-512.png", window.location.href),
                type: "image/png",
                width: 512,
                height: 512,
                alt: "Accessible First AF logo"
            }
        },
        twitter: {
            card: "summary",
            title: t("app.brand.name"),
            description: "WCAG-first components, semantic composition, routing, diagnostics, and app-building patterns.",
            image: new URL("assets/logo-512.png", window.location.href),
            imageAlt: "Accessible First AF logo"
        },
        structuredData: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Accessible First Playground",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            url: new URL(".", window.location.href).toString(),
            description: "Accessible First Playground demonstrates WCAG-first UI components, semantic composition, routing, diagnostics, and app-building patterns.",
            image: new URL("assets/logo-512.png", window.location.href).toString()
        }
    };
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

function logPlaygroundDiagnostics(): void {
    const pageDiagnostics = app.shell.inspect({
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
    });

    const manifestDiagnostics = inspectWebAppManifest(playgroundManifest, {
        requireShortName: true,
        requireDescription: true,
        requireStartUrl: true,
        requireDisplay: true,
        requireIcons: true,
        requireThemeColor: true,
        requireBackgroundColor: true,
        requireMaskableIcon: true
    });

    logAppDiagnostics(createAppDiagnosticsReport({
        page: pageDiagnostics,
        routes: routeDiagnostics,
        sources: [
            {
                id: "manifest",
                label: "Web App Manifest",
                report: manifestDiagnostics
            }
        ]
    }));
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

scheduleInitialPageScroll();
