# Navigation

Navigation provides a semantic list of primary, secondary, or in-page navigation links.

It is intentionally based on native links. This keeps it useful for multi-page applications, static sites, server-rendered pages, and SPA-style content switching.

## When To Use

Use `Navigation` when users need to move between pages, app areas, page sections, or stable content views.

Use `Breadcrumbs` for page hierarchy. Use `Menu` for command-style choices or temporary popup menus.

## Quick Start

Inside a page navigation landmark:

```ts
page.navigation(Navigation({
    items: [
        { label: "Home", href: "/" },
        { label: "Components", href: "/components", current: "page" },
        { label: "Docs", href: "/docs" }
    ]
}));
```

In-page navigation:

```ts
Navigation({
    items: [
        { label: "Buttons", href: "#buttons" },
        { label: "Forms", href: "#forms" },
        { label: "Dialogs", href: "#dialogs" }
    ]
});
```

SPA-style interception:

```ts
const navigation = Navigation({
    items: [
        { id: "home", label: "Home", href: "/" },
        { id: "settings", label: "Settings", href: "/settings" }
    ],
    onNavigate(detail, navigation) {
        detail.event.preventDefault();
        renderRoute(detail.item.href);
        navigation.setCurrent(detail.item.id ?? detail.item.href ?? null);
    }
});
```

## Layers

- Composition API: `Navigation(options)`
- Reuses: native links through `Link`, unordered list semantics, and `aria-current`

## Behavior

- Renders a semantic list of navigation links.
- Uses native `<a href>` navigation by default, so it works for multi-page applications without a router.
- Allows SPA-style navigation by cancelling the event in `onNavigate`.
- Marks the active destination with `aria-current`.
- Supports disabled, external, target, rel, hint, and link escape-hatch options through the underlying `Link`.
- Supports horizontal and vertical layouts.
- Does not add custom keyboard behavior because native links already provide correct keyboard support.

## Options

- `items` - Required navigation items.
- `orientation` - `"horizontal"` or `"vertical"`. Defaults to `"horizontal"`.
- `variant` - `"default"`, `"plain"`, or `"pills"`.
- `size` - `"md"`.
- `onNavigate` - Called when any item link is activated.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `id` - Optional stable item id, useful for SPA current-state updates.
- `label` - Required visible item content.
- `href` - Link destination. Use real URLs for multi-page apps and hashes for in-page navigation.
- `current` - Optional current marker: `true`, `false`, `"page"`, `"step"`, `"location"`, `"date"`, or `"time"`.
- `disabled` - Disables the link.
- `external` - Opens as an external link through the underlying `Link` behavior.
- `target` - Native link target.
- `rel` - Native link rel.
- `hint` - Optional shared control hint.
- `itemOptions` - Common DOM options for the list item.
- `linkOptions` - Escape hatch for the underlying composed `Link`.
- `onNavigate` - Optional item-level navigation callback.

## Update Notes

```ts
navigation.setItems([
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings", current: "page" }
]);

navigation.setCurrent("/settings");
```

`setCurrent(value)` matches an item by `id` first and then by `href`. Pass `null` to clear current state.

Updating `items` rebuilds the item list. Updating visual options keeps the existing list.

## Styling

Useful hooks include `[data-af-composition="navigation"]`, `[data-af-navigation-item]`, `[data-af-navigation-link]`, `[aria-current]`, `[data-af-orientation]`, `[data-af-variant]`, and `[data-af-size]`.

```ts
Navigation({
    className: "app-primary-nav",
    items: [...]
});
```

## Manual Checks

- Navigation is placed inside a named navigation landmark.
- Links are reachable with Tab.
- Current item is announced as current page or current location.
- Disabled items are not reachable.
- Native navigation works without JavaScript routing.
- SPA interception works only when `event.preventDefault()` is intentionally used.
- Layout wraps cleanly on small screens.
