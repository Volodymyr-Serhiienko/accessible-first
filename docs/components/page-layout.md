# PageLayout

PageLayout is a small page-building helper for applying a consistent application layout to a `createPage()` instance.

It does not create landmarks. `createPage()` still owns the semantic page structure: header, navigation, main, footer, skip link, theme, and diagnostics. PageLayout only applies layout attributes and CSS custom properties for common page behavior such as sticky footer, aligned readable width, gutters, region borders, main spacing, and responsive defaults.

## Quick Start

```ts
const page = createPage({
    title: "Accessible First App",
    theme: "system"
});

applyPageLayout(page, {
    maxWidth: "70rem",
    gutter: "1rem"
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
- Restores changed attributes and CSS custom properties when destroyed.

## Options

- `mode` - `"app"` or `"document"`. Defaults to `"app"`.
- `contained` - constrains page regions to the configured max width. Defaults to `true`.
- `borders` - draws simple separators for header, navigation, and footer. Defaults to `true`.
- `maxWidth` - CSS length for the readable content width.
- `gutter` - CSS length for responsive page side gutters.
- `mainGap` - CSS length for spacing between direct main children.
- `mainPaddingBlock` - CSS padding-block value for the main region.

## Accessibility Notes

PageLayout is intentionally semantic-neutral. It should not create a second `main`, `header`, `nav`, or `footer`. Use it with `createPage()` instead of wrapping a full page inside another full page shell.

This separation keeps page semantics predictable while still giving developers a simple default layout for real applications.
