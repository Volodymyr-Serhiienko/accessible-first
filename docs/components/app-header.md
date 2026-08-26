# AppHeader

AppHeader is a higher-level application header recipe built from `HeaderBar`, `Brand`, `HeaderTools`, `LanguageSelect`, and `ThemeToggle`.

Use it when an app needs the common header stack: brand identity, route/search/command controls, language selection, theme switching, and automatic overflow into a compact tools panel when space is tight.

## Quick Start

```ts
const routeChrome = createRouteChrome({
    routes,
    current,
    onRouteActivate,
    search: { locale },
    commands: { locale }
});

page.header(
    AppHeader({
        locale,
        brand: {
            href: "#main",
            name: "Accessible First",
            tagline: "WCAG-first app framework",
            logo: Image({ src: "./logo.svg", alt: "", decorative: true })
        },
        controls: routeChrome.headerControls,
        theme: {
            display: "switch",
            variant: "secondary"
        }
    })
);
```

## Behavior

- Creates a standard brand slot with `Brand` when `brand` options are supplied.
- Accepts already-composed brand content through `brandContent` for advanced layouts.
- Places custom `controls` before generated language and theme controls.
- Adds `LanguageSelect` automatically when `locale` is supplied, unless `language: false` is set.
- Adds `ThemeToggle` automatically unless `theme: false` is set.
- Wraps controls in `HeaderTools` by default so one control set moves between inline and overflow placement.
- Uses `HeaderBar` for the actual header layout and keeps native page landmarks outside the component.

## Options

- `brand` - `Brand` options for the standard app brand. Use `false` or `null` to omit it.
- `brandContent` - custom composed brand content. Takes priority over `brand`.
- `locale` - shared `LocaleController` for language, theme, and header tools service text.
- `controls` - app-specific controls, such as route search, command palette, profile actions, or settings buttons.
- `language` - `LanguageSelect` options without `locale`. Use `false` to omit the generated selector.
- `theme` - `ThemeToggle` options without `locale`. Use `false` to omit the generated toggle.
- `tools` - `HeaderTools` options without `controls` and `locale`. Use `false` to render controls directly in the actions slot.
- `content` - optional `HeaderBar` content slot for custom layouts.
- `layout`, `brandMaxWidth`, `variant`, `size`, `brandOptions`, `contentOptions`, `actionsOptions` - forwarded to `HeaderBar`.
- Base options: `id`, `className`, `attributes`.

## Styling

AppHeader does not add a new visual wrapper. Style the underlying hooks from `HeaderBar`, `Brand`, `HeaderTools`, `LanguageSelect`, `ThemeToggle`, and any custom controls.

Prefer component options such as `brandMaxWidth`, `Brand({ maxWidth })`, `SearchBox({ maxWidth })`, and `HeaderTools({ inlineProbeDelta })` before adding app-specific CSS.

## Accessibility Notes

AppHeader is a recipe, not a landmark. Put it inside the page or app shell header slot so the surrounding page object owns the native `header` landmark.

The generated language selector, theme toggle, and overflow tools keep their own labels, hints, announcements, and locale subscriptions. Custom controls should follow the same rule: the header arranges controls, but each control owns its accessible name and behavior.

Use `HeaderTools` overflow for responsive headers instead of duplicating desktop and mobile controls. Moving one control set avoids duplicate shortcuts, stale state, and confusing screen-reader order.

## Manual Checks

- Wide layouts keep brand and controls inline when they fit.
- Narrow layouts keep the brand visible and move controls into the HeaderTools panel.
- The HeaderTools trigger exposes a short tooltip/hint.
- Opening the tools panel announces its title and description once.
- Language and theme controls update when the shared locale changes.