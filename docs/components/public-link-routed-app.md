# PublicLinkRoutedApp

PublicLinkRoutedApp is the lower-level public-site native-link recipe for Accessible First applications. It combines `LinkRoutedApp` with public diagnostics so static pages, server-rendered pages, and MPA pages can share the same app identity, route metadata, manifest checks, localization checks, and route health reports as SPAs. For the standard app-template path, prefer [PublicLinkAppTemplate](./public-link-app-template.md).

Use it when normal browser navigation should remain the routing mechanism, but each page still wants Accessible First app chrome and public readiness checks.

## Quick Start

```ts
const routeMetadata = {
    baseUrl: window.location.origin,
    getDescription(route) {
        return t(`route.${route.id}.description`);
    }
};

const app = createPublicLinkRoutedApp({
    routes,
    mount: "#app",
    locale,
    identity: appIdentity,
    routeMetadata,
    shell: {
        title: t("app.title"),
        skipLink: t("app.skipLink"),
        skipLinkTargetId: "app-navigation",
        navigationLabel: t("app.navigationLabel"),
        metadata: getAppMetadata(),
        content: CurrentPageContent()
    },
    matchLocation: {
        matchMode: "pathname",
        baseUrl: window.location.origin
    },
    renderChrome: createLinkAppRouteChromeRenderer({
        options() {
            return {
                routes,
                header: {
                    locale,
                    identity: appIdentity,
                    brand: {
                        href: "/",
                        name: t("app.title")
                    }
                },
                navigation: {
                    id: "app-navigation",
                    trigger: t("app.navigationTrigger"),
                    locale
                },
                breadcrumbs: { label: t("app.breadcrumbsLabel") },
                search: { label: t("app.searchLabel") },
                commands: { trigger: t("app.commandsTrigger") }
            };
        }
    }),
    diagnostics: {
        identityManifestOptions: {
            lang: "en",
            dir: "ltr",
            id: "/"
        },
        locale,
        localeOptions: {
            requiredMessages: requiredMessageKeys
        },
        logOnCreate: true
    }
});
```

## What It Owns

The recipe owns only repeated public native-link app wiring:

- creates the underlying `LinkRoutedApp`;
- creates identity-aware route document metadata from top-level `identity` and `routeMetadata`;
- defaults diagnostics `page` to the app shell;
- defaults diagnostics `routes` to the app route list;
- creates `createPublicAppDiagnosticsRunner()` with app identity, identity-aware route diagnostics, locale, manifest, page, and custom sources;
- can log diagnostics after creation or after manual `refresh(...)` calls;
- exposes diagnostics methods on the returned controller.

It does not intercept links, render SPA screens, push history, or replace normal server/static navigation.

## Options

`createPublicLinkRoutedApp()` accepts all `createLinkRoutedApp()` options and adds public-app defaults.

Additional options:

- `identity` - optional public app identity used by route metadata, diagnostics, and generated manifest diagnostics.
- `routeMetadata` - identity-aware route metadata defaults, or `false` to disable route metadata automation.

Diagnostics options:

- `diagnostics` - public diagnostics options, or `false` to disable diagnostics.
- `diagnostics.page` - page diagnostics source. Defaults to the created app shell. Pass `false` to omit page diagnostics.
- `diagnostics.routes` - route diagnostics source. Defaults to the app route list. Pass `false` to omit route diagnostics.
- `diagnostics.routeOptions` - route diagnostics metadata defaults used when diagnostics inspect a route list. Defaults to top-level `routeMetadata` when provided.
- `diagnostics.logOnCreate` - logs diagnostics once after app and diagnostics setup.
- `diagnostics.logOnRefresh` - logs diagnostics after refresh calls made through the public app controller.

## Runtime

The returned controller behaves like `LinkRoutedApp` and adds:

- `diagnostics` - the diagnostics runner, or `null` when disabled.
- `inspectDiagnostics()` - returns a fresh diagnostics report without logging.
- `logDiagnostics()` - logs and returns a fresh diagnostics report.

## When To Use Lower Layers

Use `PublicLinkAppTemplate` for normal public native-link or MPA pages with standard shell and route chrome wiring.

Use `LinkRoutedApp` directly when the page is private, internal, or does not need public metadata/manifest/localization diagnostics.

Use `PublicHashRoutedApp` for hash-routed SPAs that render screens into a `PageOutlet`.

Use lower-level `AppShell`, `RouteChrome`, and route helpers when the application has custom routing or does not use the standard shell recipe.

## Manual Checks

- Current route is detected from the expected URL part.
- Navigation and breadcrumbs mark the current page.
- Native links still navigate normally.
- Route search and command palette selections navigate to route hrefs.
- Diagnostics include page, routes, locale, and manifest sources when configured.
- Locale changes refresh app-owned chrome and route metadata without reloading the page.
