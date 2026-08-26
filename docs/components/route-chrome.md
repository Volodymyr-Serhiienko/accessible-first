# RouteChrome

RouteChrome contains route-aware chrome recipes for application shells.

Use `createRouteChrome` when you only need route controls: responsive navigation, breadcrumbs, route search, and route command palette.

Use `createHashAppRouteChrome` for hash-routed SPAs. It creates the standard hash route activation handler for navigation, route search, and commands.

Use `createAppRouteChrome` when a routed app should return ready shell slots but the app owns route activation itself, such as native-link or MPA pages.

## Quick Start: Hash App Route Chrome

```ts
renderChrome({ router, route }) {
    return createHashAppRouteChrome({
        router,
        routes,
        current: route,
        header: {
            locale,
            brand: {
                href: "#main",
                name: t("app.name"),
                tagline: t("app.tagline")
            }
        },
        navigation: {
            id: "app-navigation",
            trigger: t("app.navigation.trigger"),
            variant: "pills",
            locale
        },
        breadcrumbs: {
            label: t("app.breadcrumbs.label")
        },
        search: {
            label: t("app.search.label"),
            placeholder: t("app.search.placeholder")
        },
        commands: {
            trigger: t("app.commands.trigger"),
            title: t("app.commands.title"),
            searchLabel: t("app.commands.searchLabel")
        }
    });
}
```

## Quick Start: Route Controls Only

```ts
const routeChrome = createRouteChrome({
    routes,
    current: router.getCurrentRoute(),
    onRouteActivate: activateRoute,
    navigation: { variant: "pills" },
    breadcrumbs: { label: "Current location" },
    search: { label: "Search sections" },
    commands: { trigger: "Commands", title: "Commands" }
});

shell.setHeader(AppHeader({ controls: routeChrome.headerControls }));
shell.setNavigation(routeChrome.navigation);
shell.setBeforeOutlet(routeChrome.breadcrumbs);
```

## Purpose

RouteChrome sits above individual route-aware controls and below full app templates.

`createRouteChrome` creates:

- `RouteResponsiveNavigation` when `navigation` is not `false`;
- `RouteBreadcrumbs` when `breadcrumbs` is not `false`;
- `RouteSearchBox` when `search` options are provided;
- `RouteCommandPalette` when `commands` options are provided;
- shared `headerControls` containing search and commands;
- `navigationControl` and `currentRouteControls` for routed app runtimes.

`createAppRouteChrome` builds on that and can also create:

- an `AppHeader` from `header` options;
- shell slot values for `header`, `navigation`, `beforeOutlet`, `afterOutlet`, and `footer`;
- route-control bindings that can be returned directly from `HashRoutedApp.renderChrome(...)` or `LinkRoutedApp.renderChrome(...)`.

`createHashAppRouteChrome` builds on `createAppRouteChrome` and adds standard hash-route activation defaults: update history, scroll to the outlet, and move focus into the rendered route content.

None of these helpers create route data, screen content, app copy, metadata strategy, or a router. The application still owns those decisions.

## createRouteChrome Options

- `routes` - required route descriptors used by route-aware controls.
- `current` - current route object, route id, `null`, or `undefined`.
- `navigation` - options passed to `RouteResponsiveNavigation`, or `false` to disable navigation.
- `breadcrumbs` - options passed to `RouteBreadcrumbs`, or `false` to disable breadcrumbs. Pass `breadcrumbs.routes` when breadcrumbs need a synthetic root route.
- `search` - options passed to `RouteSearchBox`, or `false`/omitted to disable route search.
- `commands` - options passed to `RouteCommandPalette`, or `false`/omitted to disable route commands.
- `onRouteActivate` - shared activation callback used by navigation, search, and commands.

## createHashAppRouteChrome Options

`createHashAppRouteChrome` accepts all `createAppRouteChrome` options except `onRouteActivate`, plus:

- `router` - required `HashRouter` used to activate routes.
- `current` - current route. Defaults to `router.getCurrentRoute()`.
- `activationOptions` - optional overrides for hash-route activation. Defaults to `updateHistory: true`, `scroll: true`, and `focusTarget: "outlet"`.

## createAppRouteChrome Options

`createAppRouteChrome` accepts all `createRouteChrome` options plus:

- `header` - `AppHeader` options. Omit it to create a minimal header only when route search/commands exist. Use `false` to explicitly clear/omit the header slot; when doing that, also disable `search`/`commands` or place `routeChrome.headerControls` yourself.
- `header.controls` - extra app controls placed beside route search and commands.
- `header.routeControlsPlacement` - `"start"` or `"end"`. Defaults to `"start"`, so route search and commands appear before custom controls.
- `shell` - optional `AppShell.update(...)` options returned with the chrome slots.
- `afterOutlet` - optional content for the shell after-outlet slot.
- `footer` - optional content for the shell footer slot.

## Returned Values

`createRouteChrome` returns:

- `navigation` - composed route responsive navigation, or `null`.
- `breadcrumbs` - composed route breadcrumbs, or `null`.
- `search` - composed route search box, or `null`.
- `commands` - composed route command palette, or `null`.
- `headerControls` - search and command controls ready for a header action area.
- `navigationControl` - control suitable for routed app `navigationControl`.
- `currentRouteControls` - controls suitable for routed app `currentRouteControls`.

`createAppRouteChrome` returns the same `routeChrome` controller, plus:

- `appHeader` - composed `AppHeader`, or `null`.
- `header`, `navigation`, `beforeOutlet`, `afterOutlet`, `footer` - shell slot content when supplied/generated.
- `navigationControl` and `currentRouteControls` - route-control bindings ready to return from routed app render callbacks.

## SPA And MPA Use

For hash-routed SPAs, prefer `createHashAppRouteChrome(...)`. Use `createAppRouteChrome(...)` with a custom `onRouteActivate` only when the app needs non-standard activation behavior.

For native-link or MPA pages, omit `onRouteActivate` when links should navigate normally. `LinkRoutedApp` can still use `navigationControl` and `currentRouteControls` to mark the current page from location matching.

## Accessibility

RouteChrome does not change the accessibility behavior of the underlying controls. Navigation remains real links, breadcrumbs remain a navigation landmark, search remains a combobox-based search control, and commands remain a dialog-based command palette.

Use application-owned text for labels, placeholders, and empty states. Pass the shared locale provider to the underlying controls when their service text should update with the application locale.

When using `createAppRouteChrome`, the generated `AppHeader` keeps one control set and lets `HeaderTools` move those controls between inline and overflow placement. This avoids duplicate mobile/desktop controls and keeps screen-reader order predictable.

## Manual Checks

- Hash navigation, search, and command palette activate routes with the same history, scroll, and focus behavior.
- Navigation and breadcrumbs update current state after route changes.
- Search and commands remain usable with keyboard and screen reader navigation.
- Header controls move into HeaderTools overflow when they do not fit.
- Native-link apps still allow normal browser navigation when `onRouteActivate` is omitted.
- Locale refresh recreates route chrome without duplicating route activation handlers.
