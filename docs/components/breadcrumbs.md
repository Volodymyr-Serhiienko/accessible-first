# Breadcrumbs

Breadcrumbs provides semantic page-path navigation for websites, dashboards, settings screens, and future application shells.

## When To Use

Use `Breadcrumbs` when users need to understand where they are in a page hierarchy and move to parent pages.

Do not use breadcrumbs as the only navigation. They complement primary navigation, sidebars, menus, and page headings.

## Quick Start

Minimal breadcrumbs:

```ts
Breadcrumbs({
    items: [
        { label: "Home", href: "/" },
        { label: "Components", href: "/components" },
        { label: "Breadcrumbs" }
    ]
});
```

With explicit current item:

```ts
Breadcrumbs({
    label: "Documentation path",
    items: [
        { label: "Docs", href: "/docs" },
        { label: "Components", href: "/docs/components" },
        { label: "Button", current: "page" }
    ]
});
```

Labelled by visible text:

```ts
Breadcrumbs({
    labelledBy: "docs-path-heading",
    items: [
        { label: "Docs", href: "/docs" },
        { label: "Components" }
    ]
});
```

Custom separator:

```ts
Breadcrumbs({
    separator: ">",
    items: [
        { label: "Settings", href: "/settings" },
        { label: "Profile" }
    ]
});
```

## Layers

- Composition API: `Breadcrumbs(options)`
- Reuses: native `<nav>`, ordered list, links, and `aria-current`

## Behavior

- Creates a native navigation landmark with an accessible name.
- Uses the default `label` only when no explicit `label` or `labelledBy` is provided; pass a localized label in real apps.
- Renders an ordered list of breadcrumb items.
- Uses links for items with `href`.
- Marks the last item as `aria-current="page"` by default.
- Allows explicit `current` values when the current item is not the last item.
- Separators are hidden from assistive technologies.
- Does not add keyboard behavior because native links already provide it.
- Does not use live regions or forced announcements; breadcrumb changes should be announced by the route/page layer when needed.
- Exposes stable data attributes for styling.

## Options

- `items` - Required list of breadcrumb items.
- `label` - Accessible navigation label. Defaults to `"Breadcrumb"` when omitted. Set `null` only when another naming mechanism is supplied.
- `labelledBy` - Optional id of visible text that labels the breadcrumb navigation. Prefer this when a nearby heading already names the path.
- `separator` - Visible separator string between items. Defaults to `"/"`.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `listOptions` - Common DOM options for the ordered list.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `label` - Required visible item content.
- `href` - Optional link destination. When omitted, the item is rendered as text.
- `current` - Optional current marker: `true`, `false`, `"page"`, `"step"`, `"location"`, `"date"`, or `"time"`.
- `itemOptions` - Common DOM options for one list item.
- `contentOptions` - Common DOM options for the link or text content.

## Update Notes

```ts
const breadcrumbs = Breadcrumbs({
    items: [
        { label: "Home", href: "/" },
        { label: "Settings" }
    ]
});

breadcrumbs.setItems([
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings" },
    { label: "Security" }
]);

breadcrumbs.update({
    separator: ">"
});
```

Updating `separator` changes existing separators in place. It does not rebuild the item list, so existing item DOM nodes and links remain stable.

Updating `items` or calling `setItems()` replaces the breadcrumb item list.

## Styling

Useful hooks include `[data-af-composition="breadcrumbs"]`, `[data-af-breadcrumbs-list]`, `[data-af-breadcrumbs-item]`, `[data-af-breadcrumbs-content]`, `[data-af-breadcrumbs-link]`, `[data-af-breadcrumbs-separator]`, `[aria-current]`, `[data-af-variant]`, and `[data-af-size]`.

```ts
Breadcrumbs({
    className: "docs-breadcrumbs",
    items: [...]
});
```

## Manual Checks

- Breadcrumbs are announced as navigation.
- Navigation has a clear accessible name.
- Localized apps pass `label` or use `labelledBy` instead of relying on the English default.
- Items are read in page-path order.
- Parent items are reachable links.
- The current item is announced as current page.
- Separators are not announced as extra content.
- Links have visible focus states.
- Layout wraps cleanly on small screens.
