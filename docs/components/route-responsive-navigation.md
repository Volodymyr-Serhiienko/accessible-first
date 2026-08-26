# RouteResponsiveNavigation

RouteResponsiveNavigation creates responsive page or app navigation from application route metadata.

Use it when a route list already describes screen ids, labels, hrefs, disabled states, and hints, and navigation should be derived from the same source of truth as route search and breadcrumbs.

## Quick Start

```ts
const navigation = RouteResponsiveNavigation({
    routes,
    current: "settings",
    trigger: "Sections",
    onRouteNavigate(detail) {
        detail.event.preventDefault();
        router.navigate(detail.route);
    }
});
```

## Purpose

Use `ResponsiveNavigation` when you already have explicit navigation items.

Use `RouteResponsiveNavigation` when navigation items should be derived from route metadata. This keeps route ids, labels, hrefs, current state, disabled state, and hints consistent with `RouteSearchBox`, `RouteBreadcrumbs`, and `HashRouter`.

## Layers

- Composition API: `RouteResponsiveNavigation(options)`
- Reuses: `ResponsiveNavigation` and `createAppRouteNavigationItems()`

## Behavior

- Converts routes into `NavigationItem` data.
- Keeps links as native anchors, so multi-page and SPA-style navigation can share the same metadata.
- Mirrors current state across desktop and mobile layouts through `ResponsiveNavigation`.
- Calls `onRouteNavigate` with the selected route when a route item is activated.
- Supports custom route label, href, hint, and disabled resolvers through `navigationItemsOptions`.
- Keeps the mobile disclosure behavior, desktop overflow scroller, focus-target helper, and link semantics from `ResponsiveNavigation`.

## Options

- `routes` - Required route metadata list.
- `navigationItemsOptions` - Options passed to `createAppRouteNavigationItems()`.
- `onRouteNavigate` - Called with the selected route when a navigation item is activated.
- `onNavigate` - Optional lower-level `ResponsiveNavigation` navigation callback.
- all `ResponsiveNavigation` options except `items`.

## Methods

- `getRoutes()` - returns the current route list.
- `setRoutes(routes)` - updates the route list and replaces navigation items.
- `getRouteFromItem(item)` - resolves a route from one generated navigation item.
- `setCurrent(match)` - updates current route state.
- `getFocusTarget()` - inherited from `ResponsiveNavigation`; returns the best visible destination for returning focus to navigation.
- `update(options)` - updates route options and underlying `ResponsiveNavigation` options.
- `destroy()` - destroys the underlying `ResponsiveNavigation`.

## Styling

RouteResponsiveNavigation uses the normal ResponsiveNavigation and Navigation DOM structure and styles.

It also adds:

```html
data-af-route-responsive-navigation
```

Useful hooks include `[data-af-route-responsive-navigation]`, `[data-af-composition="responsive-navigation"]`, `[data-af-responsive-navigation-desktop]`, `[data-af-responsive-navigation-mobile]`, `[data-af-responsive-navigation-trigger]`, and `[data-af-navigation-link]`.

```ts
RouteResponsiveNavigation({
    className: "app-navigation",
    routes,
    current: currentRoute.id
});
```

## Manual Checks

- Desktop navigation exposes a normal list of links.
- Mobile navigation opens from the trigger and closes after route activation by default.
- Current route is announced consistently in both layouts.
- Disabled routes are not activated.
- `onRouteNavigate` receives the original route object.
- Updating routes replaces desktop and mobile navigation items.
- Links remain useful when JavaScript routing is not intercepting them.
