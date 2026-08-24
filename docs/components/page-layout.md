# PageLayout

PageLayout is a small page-building helper for applying a consistent application layout to a `createPage()` instance.

It does not create landmarks. `createPage()` still owns the semantic page structure: header, navigation, main, footer, skip link, theme, and diagnostics. PageLayout only applies layout attributes and CSS custom properties for common page behavior such as sticky footer, aligned readable width, gutters, region borders, main spacing, responsive defaults, scroll-safe chrome offsets, and page chrome positioning.

## Quick Start

```ts
const page = createPage({
    title: "Accessible First App",
    theme: "system"
});

applyPageLayout(page, {
    maxWidth: "70rem",
    gutter: "1rem",
    chrome: {
        header: "reveal",
        navigation: "reveal",
        beforeOutlet: "sticky"
    }
});

page.header(Header());
page.navigation(Navigation());
page.setMainContent(outlet);
page.footer(Footer());
```

## Behavior

- Keeps semantic landmarks owned by `createPage()`.
- Adds layout attributes to the page root.
- Can make the page fill the viewport so the footer stays at the bottom when content is short.
- Can constrain header, navigation, main, and footer contents to the same readable width.
- Can add default borders between page regions.
- Can keep header, navigation, or AppShell `beforeOutlet` content in normal flow, sticky position, fixed position, or reveal-on-scroll position.
- Measures active chrome regions and sets scroll-safe offsets so route changes and focus routes do not hide content under pinned chrome.
- Restores changed attributes and CSS custom properties when destroyed.

## Options

- `mode` - `"app"` or `"document"`. Defaults to `"app"`.
- `contained` - constrains page regions to the configured max width. Defaults to `true`.
- `borders` - draws simple separators for header, navigation, and footer. Defaults to `true`.
- `maxWidth` - CSS length for the readable content width.
- `gutter` - CSS length for responsive page side gutters.
- `mainGap` - CSS length for spacing between direct main children.
- `mainPaddingBlock` - CSS padding-block value for the main region.
- `chrome` - page chrome positioning. Accepts `"normal"`, `"sticky"`, `"fixed"`, `"reveal"`, or `{ header, navigation, beforeOutlet, topOffset, zIndex }`. Defaults to normal flow.

## Chrome Modes

`normal` keeps the selected region in document flow.

`sticky` keeps the selected region visible after it reaches the top of the viewport. It is the safest first choice for compact app headers, navigation, breadcrumbs, and route helper bars because it does not remove the region from layout flow.

`fixed` pins the selected region to the viewport. Use it carefully because fixed chrome can overlap content unless the application has enough space and the behavior is tested across breakpoints.

`reveal` behaves like sticky chrome that hides while the user scrolls down and appears immediately when the user starts scrolling up. It also appears when keyboard focus enters a reveal region, so hidden chrome does not trap focus off screen. It is useful for larger application headers and navigation on mobile because it keeps controls close without permanently taking vertical space.

`beforeOutlet` targets the AppShell content rendered before `PageOutlet`. It is useful for breadcrumbs, route tabs, filters, or compact context bars that should remain available while the current screen scrolls.

`topOffset` and `zIndex` map to `--af-page-chrome-top-offset` and `--af-page-chrome-z-index` on the page root.

PageLayout measures header, navigation, and before-outlet heights with `ResizeObserver` when available. The measurement is based on the rendered elements, so changed logo size, wrapped text, language length, and responsive layout are included automatically when those regions are owned by `createPage()` / `AppShell`.

It exposes these CSS variables and attributes on the page root:

- `--af-page-header-block-size`
- `--af-page-navigation-block-size`
- `--af-page-before-outlet-block-size`
- `--af-page-navigation-offset-block-size`
- `--af-page-before-outlet-offset-block-size`
- `--af-page-scroll-margin-block-size`
- `--af-page-fixed-chrome-block-size`
- `data-af-page-chrome-visible` - `"true"` unless at least one reveal region is currently hidden

## Accessibility Notes

PageLayout is intentionally semantic-neutral. It should not create a second `main`, `header`, `nav`, or `footer`. Use it with `createPage()` instead of wrapping a full page inside another full page shell.

PageLayout has no user-facing text, no live region, and no custom focus route. It only applies layout attributes and CSS variables, so screen-reader behavior remains owned by `createPage`, `PageOutlet`, `Screen`, and the components rendered inside the page.

Sticky or reveal breadcrumbs and context bars should not replace page headings or navigation landmarks. They are orientation aids, not the only way to understand the current screen.

This separation keeps page semantics predictable while still giving developers a simple default layout for real applications.

## Manual Checks

- Header, navigation, main, and footer remain native landmarks from `createPage()`.
- Contained regions align without creating horizontal overflow on small screens.
- Sticky footer behavior keeps the footer at the viewport bottom only when content is short.
- Sticky or reveal header/navigation/breadcrumbs remain usable without creating duplicate landmarks.
- Reveal chrome hides while scrolling down and appears on the first upward scroll movement or when focus enters the hidden region.
- Route changes scroll to the beginning of the visible screen content without hiding it under pinned chrome.
- Fixed header/navigation does not hide the current focus target or first content heading.
- Borders and spacing do not clip visible focus rings.
- Removing PageLayout or calling `destroy()` restores the page to component-owned semantics.
