# PublicAppTemplate

PublicAppTemplate is the standard high-level entry point for public Accessible First applications. It chooses the appropriate public app template from one option: hash-routed SPA by default, or native-link/MPA when `mode: "link"` is set.

Use it when a new application should start from one consistent recipe for shell, route chrome, identity, localization, metadata, diagnostics, theme, and focus behavior.

## Quick Start

Hash-routed SPA, the default mode:

```ts
const app = createPublicAppTemplate({
    routes,
    mount: "#app",
    locale,
    identity,
    routeMetadata,
    shell: {
        title: () => t("app.title"),
        skipLink: () => t("app.skipLink"),
        skipLinkTargetId: "app-navigation",
        metadata: getAppMetadata,
        outletOptions: () => ({
            label: t("app.contentLabel")
        })
    },
    routeChrome: () => ({
        routes,
        header: {
            locale,
            identity
        },
        navigation: {
            id: "app-navigation",
            locale
        }
    })
});
```

Native-link or MPA mode:

```ts
const app = createPublicAppTemplate({
    mode: "link",
    routes,
    mount: "#app",
    locale,
    identity,
    routeMetadata,
    shell: {
        title: () => t("app.title"),
        content: CurrentPageContent(),
        metadata: getAppMetadata,
        outletOptions: () => ({
            label: t("app.contentLabel")
        })
    },
    matchLocation: {
        matchMode: "pathname",
        baseUrl: window.location.origin
    },
    routeChrome: () => ({
        routes,
        header: {
            locale,
            identity
        },
        navigation: {
            id: "app-navigation",
            locale
        }
    })
});
```

## Purpose

`createPublicAppTemplate()` is a small selector over the existing public templates:

- `mode` omitted or `"hash"` calls `createPublicHashAppTemplate()`.
- `mode: "link"` calls `createPublicLinkAppTemplate()`.

The wrapper exists so app starters, examples, and future generators can teach one primary API while still keeping the lower-level recipes available.

## Options

Shared options depend on the selected mode, but the intended application model is the same:

- `routes` - app route descriptors.
- `mount` - optional mount target.
- `locale` - shared locale controller or compatible locale provider.
- `identity` - stable app identity for metadata, manifest, and diagnostics.
- `routeMetadata` - identity-aware route metadata defaults, or `false`.
- `shell` - app shell configuration with template-friendly resolver support for title, skip link, navigation label, metadata, and outlet options.
- `routeChrome` - declarative route chrome options, a resolver, or `false`.
- `diagnostics` - public app diagnostics options, or `false`.

Hash mode also accepts hash-router options such as `router`, `startOptions`, and `initialScrollReset`.

Link mode also accepts native-link route matching options such as `current`, `location`, and `matchLocation`.

## When To Use Mode-Specific Templates

Use `createPublicAppTemplate()` for normal public apps and starter templates.

Use `createPublicHashAppTemplate()` directly when documentation or code should be explicitly SPA-only.

Use `createPublicLinkAppTemplate()` directly when documentation or code should be explicitly native-link or MPA-only.

Use lower routed-app layers when the app needs custom chrome rendering, private/internal behavior, or experimental lifecycle choices.

## Accessibility

The wrapper does not change accessibility behavior. It preserves the selected mode's shell, route chrome, focus, locale refresh, diagnostics, and metadata rules.

For new public apps, prefer route metadata and native hrefs wherever possible. Hash mode is appropriate for client-only SPAs; link mode is appropriate for static, server-rendered, and multi-page sites.

## Manual Checks

- Hash mode starts and renders the initial route as before.
- Link mode detects the current native-link route from the configured location.
- Locale changes refresh app-owned shell, outlet, and chrome text.
- Navigation, breadcrumbs, search, and command palette share route metadata.
- Diagnostics still include route, metadata, localization, manifest, and app-owned checks when configured.
