# HashRoutedApp

HashRoutedApp is a small SPA runtime recipe for applications that use `AppShell` and `HashRouter` together.

Use it when an app needs the common wiring that playgrounds and small SPAs otherwise repeat: shell creation, router creation, route-control binding, route metadata updates, locale refresh, mounting, startup, and cleanup.

## Quick Start

```ts
const app = createHashRoutedApp({
    routes,
    mount: "#app",
    locale,
    shell: {
        title: t("app.title"),
        skipLink: t("app.skipLink"),
        skipLinkTargetId: "app-navigation",
        navigationLabel: t("app.navigationLabel"),
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
                    brand: {
                        href: "#main",
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

HashRoutedApp is deliberately thin. For public SPAs that also need app identity, route diagnostics, manifest checks, and startup scroll reset in one entry-point recipe, use [PublicHashRoutedApp](./public-hash-routed-app.md). It does not invent route data, app copy, visual layout, or a virtual DOM. The application still owns routes, header content, navigation composition, breadcrumbs, route screens, and translations.

The helper owns repeatable lifecycle wiring:

- creates `AppShell`;
- creates `HashRouter` using `shell.outlet`;
- applies route document metadata to the shell by default;
- renders shell chrome through `renderChrome(context)`;
- binds route-aware navigation and current-route controls;
- refreshes shell chrome and the current route when the locale changes;
- optionally mounts the shell;
- starts the router unless `start: false` is used;
- destroys locale subscriptions, route bindings, router listeners, and mounted shell on cleanup.

## Options

- `routes` - required route list for `HashRouter`.
- `shell` - `AppShell` options.
- `router` - `HashRouter` options except `routes`, `outlet`, `updateDocumentMetadata`, and `onRouteChange`, which the runtime wraps.
- `locale` - optional locale controller used for `LocaleRefresh`.
- `localeRefresh` - optional refresh scheduling and route refresh options, or `false` to disable locale refresh.
- `renderChrome` - callback that returns shell slot content and route controls for the current route.
- `refreshChromeOnRouteChange` - re-renders chrome after route changes when an app has route-specific chrome. Defaults to `false`.
- `mount` - optional mount target, such as `"#app"`. Pass `false` or omit to mount manually later.
- `mountOptions` - options passed to `mount(...)`.
- `start` - set to `false` when the app should call `app.start(...)` manually.
- `startOptions` - initial `HashRouter.start(...)` options.
- `destroyOnPageHide` - set to `false` to opt out of automatic pagehide cleanup.

## Render Chrome

`renderChrome(context)` receives `shell`, `router`, `routes`, the current `route`, and refresh helpers. Return only the regions the app wants the runtime to manage:

```ts
renderChrome: createHashAppRouteChromeRenderer({
    options() {
        return {
            routes,
            header: {
                locale,
                brand: { name: t("app.title") }
            },
            navigation: { id: "app-navigation", locale },
            breadcrumbs: { label: t("app.breadcrumbsLabel") },
            search: {},
            commands: {}
        };
    }
})
```

Use `createHashAppRouteChromeRenderer(...)` for the common hash-SPA chrome path. It creates an `AppHeader`, route navigation, breadcrumbs, route search, command palette controls, and the standard route activation handler from one route list. Use `createHashAppRouteChrome(...)` directly when you already have `router` and `current` in custom render code. Use `createAppRouteChrome(...)` when activation is custom, and `createRouteChrome(...)` directly only when the app needs custom header assembly.

Stable regions such as a footer or toast viewport can live in the initial `shell` options when they do not need to be recreated on every locale refresh.

## Localization

When `locale` is provided, HashRoutedApp creates a `LocaleRefresh` subscription. On locale change it refreshes chrome and quietly re-renders the current route with:

```ts
{
    scroll: false,
    focusTarget: null,
    announcement: false
}
```

Override this through `localeRefresh.routeOptions`, or pass `localeRefresh: false` when the application owns refresh behavior manually.

## Startup Scroll

When an SPA starts with `scroll: false` and `focusTarget: null`, the browser may still restore an old page position before or after the first route render. Use `resetInitialScrollPosition()` after `app.start(...)` when the initial page should always open at the top.

```ts
app.start({
    announcement: false,
    scroll: false,
    focusTarget: null
});

resetInitialScrollPosition();
```

Route changes should still use router or PageOutlet scroll/focus options. `resetInitialScrollPosition()` is only for initial application startup.
## Methods

- `mount(target, options)` - mounts the shell when it was not mounted during creation.
- `start(options)` - starts the hash router. Useful with `start: false` when diagnostics or external setup needs the returned controller first.
- `refreshChrome()` - re-runs `renderChrome(context)` and rebinds route controls.
- `refresh(options)` - refreshes chrome and/or the current route.
- `destroy()` - removes runtime subscriptions/listeners and destroys the mounted shell.
- `isDestroyed()` - returns whether the runtime has been destroyed.

## Relationship To Other Layers

Use `AppShell` directly for static pages or apps with custom routing. Use `HashRouter` directly when an app needs lower-level control. Use HashRoutedApp when the app follows the common Accessible First SPA recipe.

Use `LinkRoutedApp` for native links, static pages, server-rendered pages, and MPA pages that should share the same route metadata model without hash routing.

## Manual Checks

- Initial hash route renders into the shell outlet.
- Header, navigation, breadcrumbs, metadata, and current route stay synchronized.
- Re-selecting the current route still moves focus into content.
- Changing locale refreshes app-owned header/navigation/search/breadcrumb text without a page reload.
- Route metadata updates after route navigation and locale refresh.
- Destroying the app removes route bindings and locale subscriptions.
