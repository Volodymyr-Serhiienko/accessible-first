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
    },
    getDocumentMetadata(route) {
        return createAppRouteDocumentMetadata(route, {
            appTitle: "Example App"
        });
    },
    updateDocumentMetadata(metadata) {
        shell.updateMetadata(metadata);
    }
});

const activateRoute = createHashRouterRouteActivationHandler(router, {
    updateHistory: true,
    scroll: true,
    focusTarget: "outlet"
});

const navigation = RouteResponsiveNavigation({
    routes: router.routes,
    current: router.getCurrentRoute().id,
    onRouteNavigate: activateRoute
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
- Activation helpers: `createHashRouterRouteActivationHandler(router, options)` and `activateHashRouterRoute(router, detail, options)`
- Binding helper: `bindHashRouterRouteControls(router, controls)`
- Refresh method: `router.refresh(options)`
- Reuses: `PageOutlet`, native URL hash/history, route-aware navigation, and current-route controls with `setCurrent(...)`

## Behavior

- Resolves the initial route from `window.location.hash`.
- Falls back to a default route when the hash is empty or unknown.
- Renders route content through `PageOutlet`.
- Updates `document.title` when configured.
- Can update document metadata when configured.
- Updates navigation current state when route changes.
- Can notify multiple route-change subscribers through `router.subscribe(...)`.
- Pushes or replaces history only when asked.
- Handles browser back/forward through `popstate` and `hashchange`.
- Activating the current route again moves focus back into the active outlet instead of doing nothing.
- Can re-render the current route without changing history through `router.refresh(...)`, useful for locale or theme-driven application copy updates.

## Route Shape

Each route needs:

- `id` - Stable route id used in the hash and current navigation matching.
- `title` - Human-readable route title.
- `render` - Function that returns composition content for the route.

Routes may include extra application-specific fields such as `label`, `keywords`, `category`, or permissions. The router preserves the route object type.

## Document Metadata

Use `getDocumentMetadata` and `updateDocumentMetadata` when route changes should update metadata beyond the document title:

```ts
const router = createHashRouter({
    routes,
    outlet: shell.outlet,
    getDocumentMetadata(route) {
        return createAppRouteDocumentMetadata(route, {
            appTitle: "Example App"
        });
    },
    updateDocumentMetadata(metadata) {
        shell.updateMetadata(metadata);
    }
});
```

The router applies metadata before route-change subscribers and diagnostics run. This keeps `page.inspect()` aligned with the active route.

## Refreshing Current Route

Use `router.refresh(...)` when the active route should be rendered again without changing the URL or history entry. This is useful when application-owned localized text, route metadata, or route-derived content changes while the user stays on the same screen.

```ts
createLocaleRefresh({
    locale,
    refresh() {
        shell.setHeader(AppHeader());
        router.refresh({
            scroll: false,
            focusTarget: null,
            announcement: false
        });
    }
});
```

By default, refresh uses quiet options suitable for in-place updates. Pass `notify: true` only when route-change subscribers should treat the refresh like a route transition.

## Activation Helper

Use `createHashRouterRouteActivationHandler()` when several route-aware controls should share the same navigation defaults. The created callback prevents the native event by default and forwards the selected route to `router.navigate(...)`.

```ts
const activateRoute = createHashRouterRouteActivationHandler(router, {
    updateHistory: true,
    scroll: true,
    focusTarget: "outlet"
});

RouteSearchBox({
    routes,
    onRouteSelect: activateRoute
});

RouteCommandPalette({
    routes,
    onRouteSelect: activateRoute
});
```

Use lower-level `activateHashRouterRoute(router, detail, options)` when one control needs custom behavior around a single activation.

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
- Header, navigation, footer, and theme controls stay stable unless the app intentionally refreshes shell chrome.
- Locale refresh can re-render the current route without pushing history or moving focus unexpectedly.
- Document title and metadata match the active route when configured.
