# HeaderBar

HeaderBar is a semantic-neutral layout component for the visible contents of a page or app header.

It should be placed inside `page.header(...)` or the `AppShell.header` slot. The native `header` landmark is still owned by `createPage()`. HeaderBar only arranges common header content such as brand, search, theme toggle, language switcher, profile controls, or other actions.

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
- Uses `layout: "auto"` by default, so slots wrap according to available inline space.
- Lets the brand take priority, then places content and actions beside it when there is room.
- Moves brand to its own row on narrower containers, while content and actions continue sharing a row when possible.
- Falls back to full-width content and actions on very narrow containers.
- Hides empty slots automatically.

## Options

- `brand` - brand/logo/name content.
- `content` - central or flexible header content, such as search.
- `actions` - controls such as theme, language, commands, profile, or account buttons.
- `layout` - `"auto"`, `"inline"`, or `"stacked"`. Defaults to `"auto"`.
- `variant` - currently `"default"` or `"plain"`. Defaults to `"default"`.
- `size` - currently `"md"`.
- `brandOptions`, `contentOptions`, `actionsOptions` - advanced DOM options for inner slots.
- Base options: `id`, `className`, `attributes`.

## Layout Modes

`auto` is the recommended default for application headers. It adapts to language length, search width, number of action buttons, and viewport/container size.

`inline` prefers a single row. Use it only when the application controls content length or provides its own overflow behavior.

`stacked` makes brand, content, and actions full-width. Use it for dense mobile-first headers or side-panel style headers.

## Styling

Useful hooks include `[data-af-composition="header-bar"]`, `[data-af-header-bar-brand]`, `[data-af-header-bar-content]`, `[data-af-header-bar-actions]`, `[data-af-header-bar-layout]`, `[data-af-variant]`, and `[data-af-size]`.

Useful layout variables:

- `--af-header-bar-gap` - horizontal gap between slots.
- `--af-header-bar-row-gap` - vertical gap when slots wrap.
- `--af-header-bar-brand-width` - preferred brand slot width.
- `--af-header-bar-brand-min-width` - minimum brand slot width before wrapping.
- `--af-header-bar-content-width` - preferred content slot width.
- `--af-header-bar-content-min-width` - minimum content slot width before wrapping.
- `--af-header-bar-content-max-width` - maximum content slot width.
- `--af-header-bar-actions-gap` - gap between action controls.

## Accessibility Notes

HeaderBar is intentionally semantic-neutral. Use it inside `page.header(...)` rather than creating another native `header` element.

Search fields and action controls keep their own labels and semantics. Do not rely on visual position alone to explain what a control does.
