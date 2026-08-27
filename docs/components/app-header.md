# AppHeader

AppHeader is a higher-level application header recipe built from `HeaderBar`, `Brand`, `HeaderTools`, `LanguageSelect`, and `ThemeToggle`.

Use it when an app needs the common header stack: brand identity, route/search/command controls, language selection, theme switching, and automatic overflow into a compact tools panel when space is tight.

For hash-routed applications, prefer `createHashAppRouteChrome` when the header controls come from route metadata. For native-link or MPA applications, prefer `createAppRouteChrome`. Use `AppHeader` directly when the app is static or owns custom controls itself.

## Quick Start

```ts
page.header(
    AppHeader({
        locale,
        identity: appIdentity,
        brand: {
            href: "#main",
            name: t("app.title"),
            tagline: t("app.tagline"),
            logoScale: 1.1
        },
        controls: [
            SearchBox({
                label: "Search app",
                placeholder: "Search"
            })
        ],
        theme: {
            display: "switch",
            variant: "secondary"
        }
    })
);
```

Minimal identity-driven header:

```ts
AppHeader({
    locale,
    identity: appIdentity
});
```

## Behavior

- Creates a standard brand slot with `Brand` when `brand` options or `identity` are supplied.
- Derives the default brand name from `identity.name` when `brand.name` is omitted.
- Derives a decorative brand logo from `identity.icons.svg` when `brand.logo` is omitted.
- Accepts already-composed brand content through `brandContent` for advanced layouts.
- Places custom `controls` before generated language and theme controls.
- Adds `LanguageSelect` automatically when `locale` is supplied, unless `language: false` is set.
- Adds `ThemeToggle` automatically unless `theme: false` is set.
- Wraps controls in `HeaderTools` by default so one control set moves between inline and overflow placement.
- Uses `HeaderBar` for the actual header layout and keeps native page landmarks outside the component.

## Options

- `identity` - optional `AppIdentity` used for default brand name and SVG logo.
- `brand` - `Brand` options for the standard app brand. `name` can be omitted when `identity` is supplied. Use `false` or `null` to omit the generated brand.
- `brandContent` - custom composed brand content. Takes priority over `identity` and `brand`.
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

The generated identity logo is decorative because the adjacent brand name gives the header a stable accessible name. Use an informative `brand.logo` only when the image itself conveys additional information.

The generated language selector, theme toggle, and overflow tools keep their own labels, hints, announcements, and locale subscriptions. Custom controls should follow the same rule: the header arranges controls, but each control owns its accessible name and behavior.

Use `HeaderTools` overflow for responsive headers instead of duplicating desktop and mobile controls. Moving one control set avoids duplicate shortcuts, stale state, and confusing screen-reader order.

## Manual Checks

- Wide layouts keep brand and controls inline when they fit.
- Narrow layouts keep the brand visible and move controls into the HeaderTools panel.
- Identity-driven headers show the expected brand name and logo.
- The HeaderTools trigger exposes a short tooltip/hint.
- Opening the tools panel announces its title and description once.
- Language and theme controls update when the shared locale changes.
