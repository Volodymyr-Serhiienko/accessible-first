# HeaderBar

HeaderBar is a semantic-neutral layout component for the visible contents of a page or app header.

It should be placed inside `page.header(...)` or the `AppShell.header` slot. The native `header` landmark is still owned by `createPage()`. HeaderBar only arranges common header content such as brand, search, theme toggle, language switcher, profile controls, or other actions.

## Quick Start

```ts
page.header(
    HeaderBar({
        brandMaxWidth: "28rem",
        brand: Brand({
            href: "#main",
            name: "Accessible First",
            tagline: "WCAG-first app framework"
        }),
        content: SearchBox({
            label: "Search app",
            width: "16rem",
            items: searchItems
        }),
        actions: ThemeToggle({
            display: "switch",
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
- Keeps content and actions beside each other as long as there is room, then falls back to full-width content and actions on very narrow containers.
- Hides empty slots automatically.

## Options

- `brand` - brand/logo/name content.
- `content` - central or flexible header content, such as search.
- `actions` - controls such as theme, language, commands, profile, or account buttons.
- `layout` - `"auto"`, `"inline"`, or `"stacked"`. Defaults to `"auto"`.
- `brandMaxWidth` - Optional CSS length for the header brand slot. Use it when a localized brand name or tagline has room but wraps too early.
- `variant` - currently `"default"` or `"plain"`. Defaults to `"default"`.
- `size` - currently `"md"`.
- `brandOptions`, `contentOptions`, `actionsOptions` - advanced DOM options for inner slots.
- Base options: `id`, `className`, `attributes`.

## Responsive Action Overflow

For dense application headers, keep `HeaderBar` as the low-level layout and use `HeaderTools` in the `actions` slot. `HeaderTools` keeps search, commands, language, theme, and future profile controls inline while they fit, then moves the same controls into a compact overflow popover when the header becomes too narrow.

When the same controls must work in both desktop and mobile layouts, move one control set between the inline area and the overflow panel instead of rendering duplicate controls. `HeaderTools` owns this pattern so applications do not need local resize probes for normal header actions.

Overflow should be selected by available space, not only by a fixed mobile breakpoint. HeaderTools switches when actions would wrap below the brand row, gives the panel an accessible title and description, announces that context when opened, keeps controls full-width when the panel is narrow, and provides an explicit close action as the final keyboard stop.

## Relationship To App Shell

HeaderBar owns only the internal header composition: brand, content, and actions. It should not own page scroll behavior.

Sticky headers, fixed navigation, reveal-on-scroll headers, and action overflow belong to higher-level `AppShell` / `PageLayout` patterns. This keeps HeaderBar small and reusable in normal pages, sidebars, dialogs, and future shell templates.

## Layout Modes

`auto` is the recommended default for application headers. It adapts to language length, search width, number of action buttons, and viewport/container size.

`inline` prefers a single row. Use it only when the application controls content length or provides its own overflow behavior.

`stacked` makes brand, content, and actions full-width. Use it for dense mobile-first headers or side-panel style headers.

## Styling

Useful hooks include `[data-af-composition="header-bar"]`, `[data-af-header-bar-brand]`, `[data-af-header-bar-content]`, `[data-af-header-bar-actions]`, `[data-af-header-bar-layout]`, `[data-af-variant]`, and `[data-af-size]`.

Useful layout variables:

- `--af-header-bar-padding-block` - vertical padding around the header contents.
- `--af-header-bar-padding-block-start` and `--af-header-bar-padding-block-end` - optional separate top/bottom padding, useful when header tooltips need extra breathing room.
- `--af-header-bar-gap` - horizontal gap between slots.
- `--af-header-bar-row-gap` - vertical gap when slots wrap.
- `--af-header-bar-brand-width` - maximum preferred brand slot width. Prefer `brandMaxWidth` for normal component assembly.
- `--af-header-bar-brand-min-width` - minimum brand slot width before wrapping.
- `--af-header-bar-content-width` - preferred content slot width.
- `--af-header-bar-content-min-width` - minimum content slot width before wrapping.
- `--af-header-bar-content-max-width` - maximum content slot width.
- `--af-header-bar-content-gap` - gap between multiple content-slot children.

## Accessibility Notes

HeaderBar is intentionally semantic-neutral. Use it inside `page.header(...)` rather than creating another native `header` element.

Search fields and action controls keep their own labels and semantics. Do not rely on visual position alone to explain what a control does.

The `actions` slot is layout-transparent in the default auto layout. Its children participate in the same flex row as the brand, so a compact search field, command button, language selector, and theme toggle wrap one item at a time instead of as one right-side block. Prefer component options such as `Brand({ maxWidth })`, `HeaderBar({ brandMaxWidth })`, and `SearchBox({ minWidth, maxWidth })` before reaching for CSS variables.
