# PublicHashRoutedApp

PublicHashRoutedApp is the public-site SPA recipe for Accessible First applications. It combines `HashRoutedApp` with public diagnostics and startup scroll reset so real apps do not repeat the same setup code in every entry file.

Use it when a hash-routed app has public-app requirements: route metadata, app identity, localization diagnostics, manifest checks, and first-load scroll behavior.

## Quick Start

```ts
const app = createPublicHashRoutedApp({
    routes,
    mount: "#app",
    locale,
    shell: {
        title: t("app.title"),
        mainId: "main",
        skipLink: t("app.skipLink"),
        skipLinkTargetId: "app-navigation",
        metadata: getAppMetadata(),
        outletOptions: {
            label: t("app.contentLabel")
        }
    },
    router: {
        getDocumentTitle(route) {
            return getRouteDocumentTitle(route);
        },
        getDocumentMetadata(route) {
            return getRouteMetadata(route);
        }
    },
    renderChrome: createHashAppRouteChromeRenderer({
        options() {
            return {
                routes,
                header: {
                    locale,
                    brand: { name: t("app.title") }
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
        identity: appIdentity,
        identityManifestOptions: {
            lang: "en",
            dir: "ltr",
            id: "."
        },
        routeOptions: {
            baseUrl: new URL(".", window.location.href)
        },
        locale,
        localeOptions: {
            requiredMessages: appRequiredMessageKeys
        },
        logOnRouteChange: true
    },
    startOptions: {
        announcement: false,
        scroll: false,
        focusTarget: null
    }
});
```

## What It Owns

The recipe owns only repeated public-app lifecycle wiring:

- creates the underlying `HashRoutedApp` with delayed startup;
- creates `createPublicAppDiagnosticsRunner()` after the shell exists;
- pairs naturally with `createAppIdentityRouteDocumentMetadata()` and identity-aware route diagnostics for route document metadata and health checks;
- defaults diagnostics `page` to the app shell;
- defaults diagnostics `routes` to the app route list;
- can log diagnostics from the router inspect hook after route renders;
- starts the router after diagnostics are connected;
- calls `resetInitialScrollPosition()` after startup unless disabled;
- cancels the startup scroll reset when the app is destroyed.

It does not invent route data, page copy, translations, visual design, metadata content, or header controls. Those stay app-owned.

## Options

`createPublicHashRoutedApp()` accepts all `createHashRoutedApp()` options except that it controls startup internally so diagnostics can be connected before the first route render.

Additional options:

- `diagnostics` - public diagnostics options, or `false` to disable diagnostics.
- `diagnostics.page` - page diagnostics source. Defaults to the created app shell. Pass `false` to omit page diagnostics.
- `diagnostics.routes` - route diagnostics source. Defaults to the app route list. Pass `false` to omit route diagnostics.
- `diagnostics.routeOptions` - route diagnostics and identity-aware route metadata defaults used when diagnostics inspect a route list.
- `diagnostics.logOnRouteChange` - logs a fresh diagnostics report from the router inspect hook after route renders and refreshes.
- `initialScrollReset` - options for `resetInitialScrollPosition()`, or `false` to disable startup scroll reset.
- `start` - starts automatically by default. Pass `false` when external setup needs to call `app.start(...)` later.

## Runtime

The returned controller behaves like `HashRoutedApp` and adds:

- `diagnostics` - the diagnostics runner, or `null` when disabled.
- `initialScrollReset` - the latest startup scroll reset controller.
- `inspectDiagnostics()` - returns a fresh diagnostics report without logging.
- `logDiagnostics()` - logs and returns a fresh diagnostics report.

## When To Use Lower Layers

Use `HashRoutedApp` directly when the app is private, internal, experimental, or needs custom startup behavior.

Use `createHashRouter()` directly when the app does not use `AppShell` or needs low-level router control.

Use [PublicLinkRoutedApp](./public-link-routed-app.md) for public native-link/MPA applications that need the same diagnostics defaults without SPA route rendering.

## Manual Checks

- Initial route renders after diagnostics are connected.
- First load opens at the top of the page, even on mobile restored tabs.
- Route navigation still scrolls and focuses the route outlet.
- Diagnostics include page, routes, locale, and manifest sources when configured.
- Locale changes still refresh app chrome and the active route without a page reload.
