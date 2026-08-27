# App Routes

App route helpers turn one route list into shared navigation, search, breadcrumb, route-trail, and document metadata.

Use them when an application has screens, pages, or demo sections that should appear in navigation, search, breadcrumbs, routing, document titles, or document metadata from the same source of truth.

## Quick Start

```ts
const routes = [
    {
        id: "home",
        title: "Home",
        label: "Home"
    },
    {
        id: "settings",
        title: "Settings",
        label: "Settings",
        parentId: "home",
        description: "Application preferences and account settings."
    }
];

const navigationItems = createAppRouteNavigationItems(routes);
const searchItems = createAppRouteSearchItems(routes);
const routeTrail = createAppRouteTrail(routes, "settings");
const breadcrumbItems = createAppRouteBreadcrumbItems(routeTrail);
const metadata = createAppRouteDocumentMetadata(routes[1], {
    appTitle: "Example App"
});
const routeReport = inspectPublicAppRoutes(routes, {
    baseUrl: "https://example.com/app/"
});

logAppRouteDiagnostics(routeReport);
```

## Purpose

Application screens are often described several times:

- once for routing;
- once for navigation;
- once for search;
- sometimes again for breadcrumbs or command menus.

App route helpers reduce that duplication. A route descriptor can feed `Navigation`, `ResponsiveNavigation`, `RouteResponsiveNavigation`, `SearchBox`, `RouteSearchBox`, `CommandPalette`, `RouteCommandPalette`, `Breadcrumbs`, `RouteBreadcrumbs`, route activation helpers, and app-level routing code.

## Route Descriptor

A route descriptor contains lightweight screen metadata:

```ts
const route = {
    id: "lessons",
    title: "Lessons",
    label: "Lessons",
    parentId: "learning",
    description: "Browse language lessons.",
    keywords: ["study", "practice"],
    href: "#lessons",
    documentTitle: "Lessons",
    metadata: {
        description: "Browse accessible language lessons."
    }
};
```

Supported fields:

- `id` - stable route id.
- `title` - screen or page title.
- `label` - shorter visible label for navigation, search, and breadcrumbs.
- `parentId` - optional parent route id used by route trail helpers.
- `href` - link target. If omitted, the default is `#${id}`.
- `description` - search result description and default document metadata description.
- `documentTitle` - optional document title override for the route.
- `metadata` - optional route-specific document metadata update options.
- `keywords` - extra search keywords.
- `disabled` - disables generated navigation or search items.
- `hint` - optional navigation hint.

## Navigation Items

```ts
const items = createAppRouteNavigationItems(routes);

ResponsiveNavigation({
    items,
    current: "settings"
});
```

Use [RouteResponsiveNavigation](./route-responsive-navigation.md) when you want a composed responsive route navigation component instead of manually wiring `ResponsiveNavigation`.

Customize generated navigation data with resolvers:

```ts
createAppRouteNavigationItems(routes, {
    getHref(route) {
        return `/app/${route.id}`;
    },
    getHint(route) {
        return `Open ${route.title}.`;
    }
});
```

## Search Items

```ts
const items = createAppRouteSearchItems(routes);

SearchBox({
    label: "Search screens",
    items,
    onSelect(detail) {
        router.navigate(detail.item.data);
    }
});
```

Use [RouteSearchBox](./route-search-box.md) when you want a composed route search component instead of manually wiring `SearchBox`. Use [RouteCommandPalette](./route-command-palette.md) when the same route metadata should power a command palette.

Customize generated search data with resolvers:

```ts
createAppRouteSearchItems(routes, {
    getDescription(route) {
        return `Open the ${route.title} screen.`;
    },
    getKeywords(route) {
        return ["screen", "app", route.id];
    }
});
```

## Route Trails

Use `createAppRouteTrail()` when breadcrumbs or page context should be derived from parent route ids. Use [RouteBreadcrumbs](./route-breadcrumbs.md) when you want a composed breadcrumb component instead of manually wiring `Breadcrumbs`:

```ts
const trail = createAppRouteTrail(routes, "settings");
```

The returned array is ordered from parent to current route. If a parent id is missing, unknown, or would create a cycle, the helper stops safely and returns the trail it can resolve.

Use a resolver when parent relationships come from application-specific data instead of `parentId`:

```ts
const trail = createAppRouteTrail(routes, currentRoute, {
    getParentId(route) {
        return route.sectionId ?? null;
    }
});
```

## Breadcrumb Items

```ts
const items = createAppRouteBreadcrumbItems(
    createAppRouteTrail(routes, "settings")
);

Breadcrumbs({ items });
```

By default, the last route in the trail becomes the current page and is not linked. Use `linkCurrent` only when the current breadcrumb should remain a link.

Customize generated breadcrumb data with resolvers:

```ts
createAppRouteBreadcrumbItems(routeTrail, {
    getLabel(route) {
        return route.label ?? route.title;
    },
    getHref(route) {
        return `/docs/${route.id}`;
    },
    getCurrent(route, index, routes) {
        return index === routes.length - 1 ? "page" : false;
    }
});
```

## Document Metadata

Use `createAppRouteDocumentMetadata()` when route metadata should also drive the browser document metadata. For public apps with an `AppIdentity`, prefer `createAppIdentityRouteDocumentMetadata()` and `createAppIdentityRouteDiagnosticsOptions()` from AppIdentity so route metadata and diagnostics automatically share the app title, base URL, and generated WebPage JSON-LD defaults:

```ts
const metadata = createAppIdentityRouteDocumentMetadata(appIdentity, currentRoute, {
    baseUrl: "https://example.com/app/",
    getDescription(route) {
        return route.description ?? null;
    }
});

shell.updateMetadata(metadata);
```

By default, the helper derives:

- `title` from `route.documentTitle`, then `route.title`, optionally combined with `appTitle`;
- `description` from `route.description`;
- additional fields from `route.metadata`;
- `canonical` from `baseUrl` plus the route href when `baseUrl` is provided;
- `structuredData` from `getStructuredData` when a route needs JSON-LD.

Customize the result with resolvers:

```ts
createAppRouteDocumentMetadata(route, {
    appTitle: "Language App",
    titleSeparator: "|",
    baseUrl: "https://example.com/app/",
    getDescription(route) {
        return route.description ?? `Open ${route.title}.`;
    },
    getMetadata(route) {
        return route.metadata ?? null;
    },
    getStructuredData(route) {
        return {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: route.title,
            description: route.description ?? null
        };
    }
});
```

This lets one route descriptor feed navigation, search, breadcrumbs, command palettes, document title, canonical URLs, structured data, and document metadata without separate per-screen wiring.

## Route Diagnostics

Use `inspectPublicAppRoutes()` for public apps and indexed route sets that should provide descriptions, document titles, canonical URLs, and structured data. Use `inspectAppRoutes()` directly for private apps or custom requirements:

```ts
const report = inspectPublicAppRoutes(routes, {
    baseUrl: "https://example.com/app/"
});

logAppRouteDiagnostics(report);
```

Diagnostics check route structure before the application grows around it:

- duplicate or empty route ids;
- empty route titles;
- duplicate or empty hrefs;
- missing, empty, self-referencing, or cyclic parent ids;
- optional document description and title requirements;
- optional canonical URL and structured data requirements for public route sets.

When descriptions, titles, canonical URLs, or structured data are resolved by application logic, pass the same resolvers used by routing or metadata:

```ts
inspectPublicAppRoutes(routes, {
    baseUrl: "https://example.com/app/",
    getDescription(route) {
        return route.description ?? `Open ${route.title}.`;
    },
    getDocumentTitle(route) {
        return `${route.title} - Example App`;
    },
    getStructuredData(route) {
        return route.metadata?.structuredData ?? null;
    }
});
```

The report uses `healthy`, `needs-attention`, or `blocked` status. `logAppRouteDiagnostics()` prints a compact console summary and categorized findings for developers.

## Location Matching

Use `getAppRouteByLocation()` when native links or multi-page applications need to determine the current route from the browser URL:

```ts
const currentRoute = getAppRouteByLocation(routes);

RouteResponsiveNavigation({
    routes,
    current: currentRoute?.id ?? null
});
```

By default, matching is automatic:

- hash links such as `#settings` match by hash;
- links with query strings match by pathname and search;
- links with hashes match by pathname, search, and hash;
- simple page links match by pathname.

Use `matchMode` when an application needs stricter behavior:

```ts
getAppRouteByLocation(routes, {
    matchMode: "pathname-search"
});
```

This keeps the same route metadata useful for hash-routed apps, static pages, server-rendered pages, and future multi-page application shells.

## Helpers

- `createAppRouteNavigationItems(routes, options)` - creates `NavigationItem[]`.
- `createAppRouteSearchItems(routes, options)` - creates `SearchBoxItem[]` with route data attached.
- `createAppRouteTrail(routes, routeOrId, options)` - creates a parent-to-current route trail.
- `createAppRouteBreadcrumbItems(routes, options)` - creates `BreadcrumbsItem[]` from a route trail.
- `getAppRouteById(routes, id)` - finds a route by id.
- `getAppRouteByLocation(routes, options)` - finds the route matching a URL/location.
- `getAppRouteLabel(route)` - returns `route.label ?? route.title`.
- `getAppRouteHref(route)` - returns explicit `href`, `null`, or `#id`.
- `getAppRouteParentId(route)` - returns explicit `parentId` or `null`.
- `getAppRouteDescription(route)` - returns route description or a default open message.
- `getAppRouteDocumentDescription(route)` - returns the description intended for document metadata.
- `getAppRouteDocumentTitle(route, options)` - returns the document title for a route.
- `createAppRouteDocumentMetadata(route, options)` - creates document metadata update options from route metadata.
- `createPublicAppRouteDiagnosticsOptions(options)` - merges route diagnostics options with public-app metadata requirements.
- `inspectAppRoutes(routes, options)` - checks route ids, hrefs, parent hierarchy, and optional metadata requirements.
- `inspectPublicAppRoutes(routes, options)` - checks routes with public-app metadata requirements enabled.
- `logAppRouteDiagnostics(report)` - logs a compact route diagnostics report to the console.
- `getAppRouteKeywords(route, extraKeywords)` - returns normalized search keywords.
- `normalizeAppRouteText(value)` - normalizes ids, labels, and titles for search.

Related AppIdentity helpers:

- `createAppIdentityRouteDocumentMetadata(identity, route, options)` - creates route metadata with shared AppIdentity defaults and generated WebPage JSON-LD.
- `createAppIdentityRouteDiagnosticsOptions(identity, options)` - creates route diagnostics options from the same identity-aware route defaults.

## Accessibility

App route helpers do not create DOM by themselves. They improve accessibility indirectly by keeping route labels, link targets, descriptions, document metadata, parent relationships, current-page state, and disabled states consistent across navigation, search, and breadcrumbs.

Good route metadata should be clear enough for both visible navigation and assistive technology output.

## AppShell Pairing

`AppShell` creates the stable application frame. App route helpers create consistent data for the frame's navigation, search controls, and route breadcrumbs.

```ts
const shell = AppShell({
    header: Header(),
    navigation: ResponsiveNavigation({
        items: createAppRouteNavigationItems(routes)
    })
});
```

Keep routing itself separate. `HashRouter`, native links, or another router can consume the same route descriptors. For hash-routed applications, use `activateHashRouterRoute()` and `bindHashRouterRouteControls()` to keep route navigation, route search, and breadcrumbs synchronized without duplicating callback code.

## Manual Checks

- Navigation labels are short and understandable.
- Search labels and descriptions explain what opens.
- Breadcrumb trails match the actual screen hierarchy.
- Current navigation state still updates after route changes.
- Disabled routes are not presented as usable actions.
- Route ids stay stable across releases.
- Parent route ids do not create cycles.
- Route diagnostics report `healthy` or only expected warnings during development.
