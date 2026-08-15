# HeaderBar

HeaderBar is a semantic-neutral layout component for the visible contents of a page or app header.

It should be placed inside `page.header(...)`. The native `header` landmark is still owned by `createPage()`. HeaderBar only arranges common header content such as brand, search, theme toggle, language switcher, profile controls, or other actions.

## Quick Start

```ts
page.header(
    HeaderBar({
        brand: Brand({
            href: "#main",
            name: "Accessible First",
            tagline: "WCAG-first app framework"
        }),
        content: SearchBox({
            label: "Search app",
            items: searchItems
        }),
        actions: ThemeToggle({
            variant: "secondary"
        })
    })
);
```

## Behavior

- Does not create a landmark.
- Keeps the page `header` landmark controlled by `createPage()`.
- Provides dedicated slots for brand, central content, and actions.
- Collapses into a comfortable vertical layout on small screens.
- Hides empty slots automatically.

## Options

- `brand` - brand/logo/name content.
- `content` - central or flexible header content, such as search.
- `actions` - controls such as theme, language, profile, or account buttons.
- `variant` - currently `default` or `plain`. Defaults to `default`.
- `size` - currently `md`.
- `brandOptions`, `contentOptions`, `actionsOptions` - advanced DOM options for inner slots.
- Base options: `id`, `className`, `attributes`.

## Accessibility Notes

HeaderBar is intentionally semantic-neutral. Use it inside `page.header(...)` rather than creating another native `header` element.

Search fields and action controls keep their own labels and semantics. Do not rely on visual position alone to explain what a control does.
