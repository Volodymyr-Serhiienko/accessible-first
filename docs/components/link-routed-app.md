# LinkRoutedApp

LinkRoutedApp is a small runtime recipe for applications that use `AppShell` with normal browser links, static pages, server-rendered pages, or multi-page applications.

Use it when an app wants the same route metadata model as a SPA, but does not want hash routing or client-side screen rendering.

## Quick Start

```ts
const app = createLinkRoutedApp({
    routes,
    mount: "#app",
    locale,
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
    routeMetadata: {
        appTitle: t("app.title"),
        baseUrl: window.location.origin
    },
    renderChrome: createLinkAppRouteChromeRenderer({
        options() {
            return {
                routes,
                header: {
                    locale,
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
                breadcrumbs: {
                    label: t("app.breadcrumbsLabel")
                },
                search: {},
                commands: {}
            };
        }
    })
});
```

## Purpose

LinkRoutedApp is deliberately thin. For public native-link/MPA pages that also need app identity, route diagnostics, manifest checks, and localization checks in one entry-point recipe, use [PublicLinkRoutedApp](./public-link-routed-app.md). It does not intercept links, push history, or render route screens. Native browser navigation remains the routing mechanism.

The helper owns repeatable page-shell wiring:

- creates `AppShell`;
- finds the current route from an explicit `current` value or from the browser location;
- applies route-derived document metadata by default;
- renders shell chrome through `renderChrome(context)`;
- synchronizes navigation and current-route controls;
- refreshes app-owned chrome and metadata when the locale changes;
- optionally mounts the shell;
- destroys locale subscriptions and the mounted shell on cleanup.

## Options

- `routes` - required route list shared with navigation, search, breadcrumbs, metadata, diagnostics, and sitemap helpers.
- `shell` - `AppShell` options. For MPA pages, route content usually belongs in `shell.content`.
- `current` - explicit current route object, route id, `null`, or `undefined`. When omitted, the helper resolves the route from location.
- `location` - optional location-like value used instead of the current browser location.
- `matchLocation` - route-location matching options except `location`.
- `routeMetadata` - options passed to `createAppRouteDocumentMetadata(...)`, or `false` to disable route metadata updates.
- `updateDocumentMetadata` - custom metadata writer. Defaults to `shell.updateMetadata(...)`.
- `locale` - optional locale controller used for `LocaleRefresh`.
- `localeRefresh` - optional refresh scheduling options, or `false` to disable locale refresh.
- `renderChrome` - callback that returns shell slot content and route controls for the current route.
- `mount` - optional mount target, such as `"#app"`. Pass `false` or omit to mount manually later.
- `mountOptions` - options passed to `mount(...)`.
- `destroyOnPageHide` - set to `false` to opt out of automatic pagehide cleanup.

## Render Chrome

`renderChrome(context)` receives `shell`, `routes`, the matched `route`, and refresh helpers. The route can be `null` when the current URL does not match the route list.

Use `createLinkAppRouteChromeRenderer(...)` for the common native-link route chrome path:

```ts
renderChrome: createLinkAppRouteChromeRenderer({
    options() {
        return {
            routes,
            header: {
                locale,
                brand: { href: "/", name: t("app.title") }
            },
            navigation: { id: "app-navigation", locale },
            breadcrumbs: { label: t("app.breadcrumbsLabel") },
            search: {},
            commands: {}
        };
    }
})
```

This creates an `AppHeader`, route navigation, breadcrumbs, route search, command palette controls, and native-link route activation from one route list. Normal navigation links remain real links. Search and command palette selections navigate to the selected route `href` because those controls are not links themselves.

Use `createLinkAppRouteChrome(...)` directly when you already have the current route in custom render code. Use `createAppRouteChrome(...)` when the app owns custom activation behavior. Use `createRouteChrome(...)` directly only when the app needs custom header assembly.

## Localization

When `locale` is provided, LinkRoutedApp creates a `LocaleRefresh` subscription. On locale change it re-runs `renderChrome(...)` and reapplies route metadata. It does not reload the page and does not re-render page-specific content.

If a page contains application copy created during composition, the page can either recreate that content through its own locale refresh or rely on a full native page load after locale change.

## Methods

- `getCurrentRoute()` - returns the currently matched route, or `null`.
- `mount(target, options)` - mounts the shell when it was not mounted during creation.
- `refreshChrome()` - re-runs `renderChrome(context)` and synchronizes route controls.
- `refresh(options)` - refreshes the current route match, chrome, and/or metadata.
- `destroy()` - removes runtime subscriptions/listeners and destroys the mounted shell.
- `isDestroyed()` - returns whether the runtime has been destroyed.

## Relationship To Other Layers

Use `HashRoutedApp` for small SPAs that render screens into `PageOutlet`. Use LinkRoutedApp for native links, static pages, server-rendered pages, and MPA pages that still want shared route metadata and app chrome conventions.

Both recipes should share the same route descriptors. This keeps navigation, breadcrumbs, command palettes, metadata, sitemap generation, and diagnostics aligned across SPA and MPA applications.

## Manual Checks

- Current route is detected from the expected URL part.
- Navigation and breadcrumbs mark the current page.
- Native links still work without JavaScript route interception.
- Route search and command palette selections navigate to route hrefs.
- Route metadata updates document title, description, canonical URL, and social metadata when configured.
- Locale changes refresh app-owned header/navigation/breadcrumb text without duplicating screen-reader speech.
- Destroying the app removes locale subscriptions and pagehide cleanup.
