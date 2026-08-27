# RouteChrome

RouteChrome contains route-aware chrome recipes for application shells.

Use `createRouteChrome` when you only need route controls: responsive navigation, breadcrumbs, route search, and route command palette.

Use `createHashAppRouteChromeRenderer` inside `HashRoutedApp.renderChrome` for the common hash-routed SPA path. Use `createHashAppRouteChrome` directly when app code already has a router and current route.

Use `createLinkAppRouteChromeRenderer` inside `LinkRoutedApp.renderChrome` for native-link, static-page, server-rendered, and MPA pages. It keeps navigation links native and lets route search or command palette selections navigate through route `href` values.

Use `createAppRouteChrome` when a routed app should return ready shell slots but the app owns route activation itself.

## Quick Start: Hash Routed App Chrome

```ts
renderChrome: createHashAppRouteChromeRenderer({
    options() {
        return {
            routes,
            header: {
                locale,
                identity: appIdentity,
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
                label: t("app.breadcrumbs.label"),
                root: {
                    id: "home",
                    title: t("app.home"),
                    href: "#home"
                }
            },
            search: {
                label: t("app.search.label"),
                placeholder: t("app.search.placeholder")
            },
            commands: {
                trigger: t("app.commands.trigger"),
                title: t("app.commands.title"),
                searchLabel: t("app.commands.searchLabel")
            },
            navigationReturnLink: {
                text: t("app.navigation.returnLink"),
                href: "#app-navigation"
            }
        };
    }
})
```

## Quick Start: Native-Link App Chrome

```ts
renderChrome: createLinkAppRouteChromeRenderer({
    options() {
        return {
            routes,
            header: {
                locale,
                identity: appIdentity,
                brand: {
                    href: "/",
                    name: t("app.name")
                }
            },
            navigation: {
                id: "app-navigation",
                trigger: t("app.navigation.trigger"),
                locale
            },
            breadcrumbs: {
                label: t("app.breadcrumbs.label"),
                root: {
                    id: "home",
                    title: t("app.home"),
                    href: "#home"
                }
            },
            search: {
                label: t("app.search.label"),
                placeholder: t("app.search.placeholder")
            },
            commands: {
                trigger: t("app.commands.trigger"),
                title: t("app.commands.title"),
                searchLabel: t("app.commands.searchLabel")
            },
            navigationReturnLink: {
                text: t("app.navigation.returnLink"),
                href: "#app-navigation"
            }
        };
    }
})
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

- an `AppHeader` from `header` options, including identity-derived brand defaults when `header.identity` is supplied;
- shell slot values for `header`, `navigation`, `beforeOutlet`, `afterOutlet`, and `footer`, including optional after-outlet navigation return links;
- route-control bindings that can be returned directly from `HashRoutedApp.renderChrome(...)` or `LinkRoutedApp.renderChrome(...)`.

`createHashAppRouteChrome` builds on `createAppRouteChrome` and adds standard hash-route activation defaults: update history, scroll to the outlet, and move focus into the rendered route content.

`createHashAppRouteChromeRenderer` wraps hash route chrome as a ready `HashRoutedApp.renderChrome` callback. It supplies the current router and route from the app runtime, while app code provides only route chrome options.

`createLinkAppRouteChrome` builds on `createAppRouteChrome` and adds native-link activation. Real anchor clicks keep normal browser behavior. Route search and command palette selections use the route `href` because those controls are not native links themselves.

`createLinkAppRouteChromeRenderer` wraps native-link route chrome as a ready `LinkRoutedApp.renderChrome` callback. It supplies the current route from the app runtime.

None of these helpers create route data, screen content, app copy, metadata strategy, or a router. The application still owns those decisions.

## createRouteChrome Options

- `routes` - required route descriptors used by route-aware controls.
- `current` - current route object, route id, `null`, or `undefined`.
- `navigation` - options passed to `RouteResponsiveNavigation`, or `false` to disable navigation.
- `breadcrumbs` - options passed to `RouteBreadcrumbs`, or `false` to disable breadcrumbs.
- `breadcrumbs.root` - optional synthetic root route prepended to breadcrumb trails. Routes without `parentId` become children of this root unless `trailOptions.getParentId` returns another value.
- `breadcrumbs.routes` - optional breadcrumb-only route list when breadcrumbs need a custom hierarchy.
- `search` - options passed to `RouteSearchBox`, or `false`/omitted to disable route search.
- `commands` - options passed to `RouteCommandPalette`, or `false`/omitted to disable route commands.
- `onRouteActivate` - shared activation callback used by navigation, search, and commands.

## createHashAppRouteChromeRenderer Options

`createHashAppRouteChromeRenderer` accepts:

- `options` - either static hash app route chrome options without `router` and `current`, or a resolver called with the current `HashRoutedApp` context.
- `onCreate` - optional hook called with the generated chrome and context. Use it to save generated controls such as navigation focus targets.

Use a resolver when labels, metadata, or shell copy should reflect the current locale.

## createHashAppRouteChrome Options

`createHashAppRouteChrome` accepts all `createAppRouteChrome` options except `onRouteActivate`, plus:

- `router` - required `HashRouter` used to activate routes.
- `current` - current route. Defaults to `router.getCurrentRoute()`.
- `activationOptions` - optional overrides for hash-route activation. Defaults to `updateHistory: true`, `scroll: true`, and `focusTarget: "outlet"`.

## createLinkAppRouteChromeRenderer Options

`createLinkAppRouteChromeRenderer` accepts:

- `options` - either static link app route chrome options without `current`, or a resolver called with the current `LinkRoutedApp` context.
- `onCreate` - optional hook called with the generated chrome and context. Use it to save generated controls such as navigation focus targets.

Use a resolver when labels, metadata, or shell copy should reflect the current locale.

## createLinkAppRouteChrome Options

`createLinkAppRouteChrome` accepts all `createAppRouteChrome` options except `onRouteActivate`, plus:

- `current` - current route. Defaults to `null` for unmatched pages.
- `activationOptions` - href-based activation options, or `false` to disable managed activation.

`activationOptions` supports:

- `getHref` - route href resolver. Defaults to `getAppRouteHref(route)`.
- `ownerWindow` - window used for programmatic navigation.
- `replace` - use `location.replace(...)` instead of `location.assign(...)`.
- `preventDefault` - `"auto"`, `true`, or `false`. The default `"auto"` preserves native anchor behavior and prevents non-link route selections before navigating.

## createAppRouteChrome Options

`createAppRouteChrome` accepts all `createRouteChrome` options plus:

- `header` - `AppHeader` options. Omit it to create a minimal header only when route search/commands exist. Use `false` to explicitly clear/omit the header slot; when doing that, also disable `search`/`commands` or place `routeChrome.headerControls` yourself.
- `header.controls` - extra app controls placed beside route search and commands.
- `header.routeControlsPlacement` - `"start"` or `"end"`. Defaults to `"start"`, so route search and commands appear before custom controls.
- `shell` - optional `AppShell.update(...)` options returned with the chrome slots.
- `navigationReturnLink` - optional `ResponsiveNavigationFocusLink` options without `navigation`; creates an after-outlet link that returns focus to the generated route navigation.
- `afterOutlet` - optional content for the shell after-outlet slot. When `navigationReturnLink` is also provided, the generated return link is prepended before this content.
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

`createAppRouteChrome`, `createHashAppRouteChrome`, and `createLinkAppRouteChrome` return the same route chrome controller, plus:

- `appHeader` - composed `AppHeader`, or `null`.
- `header`, `navigation`, `beforeOutlet`, `afterOutlet`, `footer` - shell slot content when supplied/generated. `afterOutlet` can include the generated `navigationReturnLink` plus app-provided after-outlet content.
- `navigationControl` and `currentRouteControls` - route-control bindings ready to return from routed app render callbacks.

## SPA And MPA Use

For hash-routed SPAs built with `HashRoutedApp`, prefer `createHashAppRouteChromeRenderer(...)`. Use `createHashAppRouteChrome(...)` when app code already owns the render callback. Use `createAppRouteChrome(...)` with a custom `onRouteActivate` only when the app needs non-standard activation behavior.

For native-link and MPA pages built with `LinkRoutedApp`, prefer `createLinkAppRouteChromeRenderer(...)`. It keeps regular navigation links real while making route search and command palette controls useful without a client-side router.

## Accessibility

RouteChrome does not change the accessibility behavior of the underlying controls. Navigation remains real links, breadcrumbs remain a navigation landmark, search remains a combobox-based search control, and commands remain a dialog-based command palette.

Use application-owned text for labels, placeholders, and empty states. Pass the shared locale provider to the underlying controls when their service text should update with the application locale.

When using app route chrome helpers, the generated `AppHeader` keeps one control set and lets `HeaderTools` move those controls between inline and overflow placement. This avoids duplicate mobile/desktop controls and keeps screen-reader order predictable.

## Manual Checks

- Hash navigation, search, and command palette activate routes with the same history, scroll, and focus behavior.
- Native-link navigation remains a normal link, including browser behaviors such as opening in a new tab.
- Native-link route search and command palette selections navigate to route hrefs.
- Navigation and breadcrumbs update current state after route changes.
- Search and commands remain usable with keyboard and screen reader navigation.
- Header controls move into HeaderTools overflow when they do not fit.
- Locale refresh recreates route chrome without duplicating route activation handlers.
- HashRoutedApp and LinkRoutedApp renderers can be expressed declaratively without repeating current-route wiring.
- Optional navigation return links move focus back to the visible route navigation target without app-owned navigation references.
