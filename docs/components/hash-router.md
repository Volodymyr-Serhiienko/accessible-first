# HashRouter

HashRouter is a small page-building helper for switching application screens by URL hash.

It pairs route definitions with `PageOutlet`, updates browser history, synchronizes current route controls, and handles same-route activation as a focus jump back into content.

## When To Use

Use `createHashRouter` for lightweight SPA-style demos, documentation playgrounds, static sites, and small applications that do not need a full routing framework.

Use normal links and server-rendered pages when each route should be a separate document. Use a larger router only when an application needs nested routes, loaders, guards, or complex URL patterns.

## Quick Start

```ts
const outlet = PageOutlet({
    label: "Application content"
});

const router = createHashRouter({
    routes: [
        { id: "home", title: "Home", render: HomeScreen },
        { id: "settings", title: "Settings", render: SettingsScreen }
    ],
    outlet,
    getDocumentTitle(route) {
        return `${route.title} - Example App`;
    }
});

const navigation = RouteResponsiveNavigation({
    routes: router.routes,
    current: router.getCurrentRoute().id,
    onRouteNavigate(detail) {
        activateHashRouterRoute(router, detail, {
            updateHistory: true,
            scroll: true,
            focusTarget: "outlet"
        });
    }
});

const breadcrumbs = RouteBreadcrumbs({
    routes: router.routes,
    current: router.getCurrentRoute()
});

bindHashRouterRouteControls(router, {
    navigation,
    currentRouteControls: [breadcrumbs]
});

router.start();
```

## Layers

- Helper API: `createHashRouter(options)`
- Activation helper: `activateHashRouterRoute(router, detail, options)`
- Binding helper: `bindHashRouterRouteControls(router, controls)`
- Reuses: `PageOutlet`, native URL hash/history, route-aware navigation, and current-route controls with `setCurrent(...)`

## Behavior

- Resolves the initial route from `window.location.hash`.
- Falls back to a default route when the hash is empty or unknown.
- Renders route content through `PageOutlet`.
- Updates `document.title` when configured.
- Updates navigation current state when route changes.
- Can notify multiple route-change subscribers through `router.subscribe(...)`.
- Pushes or replaces history only when asked.
- Handles browser back/forward through `popstate` and `hashchange`.
- Activating the current route again moves focus back into the active outlet instead of doing nothing.

## Route Shape

Each route needs:

- `id` - Stable route id used in the hash and current navigation matching.
- `title` - Human-readable route title.
- `render` - Function that returns composition content for the route.

Routes may include extra application-specific fields such as `label`, `keywords`, `category`, or permissions. The router preserves the route object type.

## Activation Helper

Use `activateHashRouterRoute()` inside route-aware component callbacks. It prevents the native event by default and forwards the route to `router.navigate(...)`.

```ts
RouteSearchBox({
    routes,
    onRouteSelect(detail) {
        activateHashRouterRoute(router, detail, {
            updateHistory: true,
            scroll: true,
            focusTarget: "outlet"
        });
    }
});
```

This keeps navigation, route search, command palettes, and future route-aware controls using the same activation defaults.

## Binding Helper

Use `bindHashRouterRouteControls()` when navigation, breadcrumbs, or another current-route control should mirror the active route.

```ts
const unbind = bindHashRouterRouteControls(router, {
    navigation,
    currentRouteControls: [breadcrumbs]
});
```

The helper calls `router.setNavigation(...)`, synchronizes the initial route, and subscribes to future route changes. Call the returned function when the surrounding app shell is destroyed.

## Manual Checks

- Opening a hash URL renders the matching route.
- Unknown hashes fall back to the default route.
- Navigation items update `aria-current`.
- Breadcrumbs update after route changes.
- Search result activation uses the same focus and scroll behavior as navigation activation.
- Re-activating the current navigation item focuses the active screen.
- Browser back and forward restore the previous screen.
- Header, navigation, footer, and theme controls are not recreated.
