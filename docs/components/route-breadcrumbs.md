# RouteBreadcrumbs

RouteBreadcrumbs creates breadcrumb navigation from application route metadata.

Use it when a route list already describes screen ids, titles, labels, hrefs, and parent relationships, and the UI should derive breadcrumbs from the same source of truth as navigation and search.

## Quick Start

```ts
const routes = [
    { id: "home", title: "Home" },
    { id: "settings", title: "Settings", parentId: "home" },
    { id: "security", title: "Security", parentId: "settings" }
];

RouteBreadcrumbs({
    routes,
    current: "security"
});
```

This renders a breadcrumb trail from parent to current route.

## Purpose

Use `Breadcrumbs` when you already have explicit breadcrumb items.

Use `RouteBreadcrumbs` when breadcrumb items should be derived from route metadata. This keeps hierarchy, labels, hrefs, and current-page state consistent with `Navigation`, `ResponsiveNavigation`, `SearchBox`, and `HashRouter`.

When breadcrumbs are part of a routed app shell, `createRouteChrome()` can add a synthetic `breadcrumbs.root` route so app code does not need a separate breadcrumb-only route list for the common Home / Current page pattern.

## Layers

- Composition API: `RouteBreadcrumbs(options)`
- Reuses: `Breadcrumbs`, `createAppRouteTrail()`, and `createAppRouteBreadcrumbItems()`

## Behavior

- Resolves the current route from a route object or route id.
- Builds a parent-to-current trail using `parentId` by default.
- Supports a custom parent resolver through `trailOptions.getParentId`.
- Creates regular `Breadcrumbs` items from the resolved route trail.
- Marks the current route with `aria-current="page"` by default.
- Keeps links as native anchors, so multi-page and SPA-style navigation can share the same metadata.

## Options

- `routes` - Required route metadata list.
- `current` - Current route object, route id, `null`, or `undefined`.
- `trailOptions` - Options passed to `createAppRouteTrail()`.
- `breadcrumbItemsOptions` - Options passed to `createAppRouteBreadcrumbItems()`.
- all `Breadcrumbs` options except `items`.

## Methods

- `setRoutes(routes)` - updates the route list and refreshes the breadcrumb trail.
- `setCurrent(routeOrId)` - updates the current route and refreshes the breadcrumb trail.
- `getCurrent()` - returns the current route object, id, or nullish value used by the component.
- `update(options)` - updates route options and underlying `Breadcrumbs` options.
- `destroy()` - destroys the underlying `Breadcrumbs` component.

## Styling

RouteBreadcrumbs uses the normal Breadcrumbs DOM structure and styles.

It also adds:

```html
data-af-route-breadcrumbs
```

Useful hooks include `[data-af-composition="breadcrumbs"]`, `[data-af-route-breadcrumbs]`, `[data-af-breadcrumbs-list]`, `[data-af-breadcrumbs-content]`, `[aria-current]`, `[data-af-variant]`, and `[data-af-size]`.

```ts
RouteBreadcrumbs({
    className: "app-breadcrumbs",
    routes,
    current: currentRoute
});
```

## Manual Checks

- The breadcrumb trail matches the route hierarchy.
- Parent routes are links when they have hrefs.
- The current route is announced as the current page.
- Unknown current routes render an empty breadcrumb list rather than throwing.
- Cyclic or missing parent ids do not freeze the page.
- Links and current state stay synchronized after route changes.
