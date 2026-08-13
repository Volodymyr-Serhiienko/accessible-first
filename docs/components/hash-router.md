# HashRouter

HashRouter is a small page-building helper for switching application screens by URL hash.

It pairs route definitions with `PageOutlet`, keeps navigation current state synchronized, updates browser history, and handles same-route activation as a focus jump back into content.

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

const navigation = ResponsiveNavigation({
    current: router.getCurrentRoute().id,
    items: router.routes.map((route) => ({
        id: route.id,
        label: route.title,
        href: router.getRouteHref(route)
    })),
    onNavigate(detail) {
        detail.event.preventDefault();
        router.navigate(detail.item.id ?? null, {
            updateHistory: true
        });
    }
});

router.setNavigation(navigation);
router.start();
```

## Layers

- Helper API: `createHashRouter(options)`
- Reuses: `PageOutlet`, native URL hash/history, and navigation components with `setCurrent(...)`

## Behavior

- Resolves the initial route from `window.location.hash`.
- Falls back to a default route when the hash is empty or unknown.
- Renders route content through `PageOutlet`.
- Updates `document.title` when configured.
- Updates navigation current state when route changes.
- Pushes or replaces history only when asked.
- Handles browser back/forward through `popstate` and `hashchange`.
- Activating the current route again moves focus back into the active outlet instead of doing nothing.

## Route Shape

Each route needs:

- `id` - Stable route id used in the hash and current navigation matching.
- `title` - Human-readable route title.
- `render` - Function that returns composition content for the route.

Routes may include extra application-specific fields such as `label`, `keywords`, `category`, or permissions. The router preserves the route object type.

## Manual Checks

- Opening a hash URL renders the matching route.
- Unknown hashes fall back to the default route.
- Navigation items update `aria-current`.
- Re-activating the current navigation item focuses the active screen.
- Browser back and forward restore the previous screen.
- Header, navigation, footer, and theme controls are not recreated.
