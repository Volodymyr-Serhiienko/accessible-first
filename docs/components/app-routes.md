# App Routes

App route helpers turn one route list into shared navigation and search data.

Use them when an application has screens, pages, or demo sections that should appear in navigation, search, or routing from the same source of truth.

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
        description: "Application preferences and account settings."
    }
];

const navigationItems = createAppRouteNavigationItems(routes);
const searchItems = createAppRouteSearchItems(routes);
```

## Purpose

Application screens are often described several times:

- once for routing;
- once for navigation;
- once for search;
- sometimes again for breadcrumbs or command menus.

App route helpers reduce that duplication. A route descriptor can feed `Navigation`, `ResponsiveNavigation`, `SearchBox`, and app-level routing code.

## Route Descriptor

A route descriptor contains lightweight screen metadata:

```ts
const route = {
    id: "lessons",
    title: "Lessons",
    label: "Lessons",
    description: "Browse language lessons.",
    keywords: ["study", "practice"],
    href: "#lessons"
};
```

Supported fields:

- `id` - stable route id.
- `title` - screen or page title.
- `label` - shorter visible label for navigation and search.
- `href` - link target. If omitted, the default is `#${id}`.
- `description` - search result description.
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

## Helpers

- `createAppRouteNavigationItems(routes, options)` - creates `NavigationItem[]`.
- `createAppRouteSearchItems(routes, options)` - creates `SearchBoxItem[]` with route data attached.
- `getAppRouteLabel(route)` - returns `route.label ?? route.title`.
- `getAppRouteHref(route)` - returns explicit `href`, `null`, or `#id`.
- `getAppRouteDescription(route)` - returns route description or a default open message.
- `getAppRouteKeywords(route, extraKeywords)` - returns normalized search keywords.
- `normalizeAppRouteText(value)` - normalizes ids, labels, and titles for search.

## Accessibility

App route helpers do not create DOM by themselves. They improve accessibility indirectly by keeping route labels, link targets, descriptions, and disabled states consistent across navigation and search.

Good route metadata should be clear enough for both visible navigation and assistive technology output.

## AppShell Pairing

`AppShell` creates the stable application frame. App route helpers create consistent data for the frame's navigation and search controls.

```ts
const shell = AppShell({
    header: Header(),
    navigation: ResponsiveNavigation({
        items: createAppRouteNavigationItems(routes)
    })
});
```

Keep routing itself separate. `HashRouter`, native links, or another router can consume the same route descriptors.

## Manual Checks

- Navigation labels are short and understandable.
- Search labels and descriptions explain what opens.
- Current navigation state still updates after route changes.
- Disabled routes are not presented as usable actions.
- Route ids stay stable across releases.
