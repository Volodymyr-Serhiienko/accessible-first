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
        navigationLabel: t("app.navigationLabel"),
        metadata: getAppMetadata(),
        outletOptions: {
            label: t("app.contentLabel")
        }
    },
    router: {
        getDocumentTitle(route) {
            return `${route.title} - Example App`;
        },
        getDocumentMetadata(route) {
            return getRouteMetadata(route);
        }
    },
    renderChrome({ router, route }) {
        const activateRoute = createHashRouterRouteActivationHandler(router, {
            updateHistory: true,
            scroll: true,
            focusTarget: "outlet"
        });
        const navigation = AppNavigation({
            current: route.id,
            onRouteNavigate: activateRoute
        });
        const breadcrumbs = AppBreadcrumbs(route);

        return {
            shell: {
                title: t("app.title"),
                skipLink: t("app.skipLink"),
                navigationLabel: t("app.navigationLabel"),
                metadata: getAppMetadata()
            },
            header: AppHeader({ router }),
            navigation,
            beforeOutlet: breadcrumbs,
            navigationControl: navigation,
            currentRouteControls: [breadcrumbs]
        };
    }
});
```

## Purpose

HashRoutedApp is deliberately thin. It does not invent route data, app copy, visual layout, or a virtual DOM. The application still owns routes, header content, navigation composition, breadcrumbs, route screens, and translations.

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
return {
    shell: {
        title: t("app.title"),
        metadata: getAppMetadata()
    },
    header: AppHeader({ router }),
    navigation,
    beforeOutlet: breadcrumbs,
    navigationControl: navigation,
    currentRouteControls: [breadcrumbs]
};
```

Use `navigationControl` for the route-aware navigation control that should mirror the current hash route. Use `currentRouteControls` for breadcrumbs or other controls with `setCurrent(...)`. Use `createHashRouterRouteActivationHandler(...)` when navigation, route search, and command palette should share the same activation behavior.

Use `createRouteChrome(...)` when an app wants to create route navigation, breadcrumbs, route search, and command palette controls from one route list and one shared activation handler.

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
