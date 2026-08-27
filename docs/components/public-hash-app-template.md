# PublicHashAppTemplate

PublicHashAppTemplate is the first high-level Accessible First SPA template. It creates a public hash-routed app from app-owned routes, shell text, route chrome, metadata, locale, and diagnostics options.

Use it when an application follows the standard public SPA shape and should not repeat low-level `shell`, `renderChrome`, diagnostics, startup, and locale-refresh wiring in every entry file.

## Quick Start

```ts
const app = createPublicHashAppTemplate({
    routes,
    mount: "#app",
    locale,
    identity: appIdentity,
    routeMetadata,
    shell: {
        title: () => t("app.title"),
        skipLink: () => t("app.skipLink"),
        skipLinkTargetId: "app-navigation",
        navigationLabel: () => t("app.navigationLabel"),
        metadata: getAppMetadata,
        footer: Footer(),
        outletOptions: {
            label: t("app.contentLabel")
        },
        layout: {
            maxWidth: "72rem",
            gutter: "1rem",
            chrome: {
                header: "normal",
                navigation: "reveal",
                beforeOutlet: "sticky"
            }
        }
    },
    routeChrome: () => ({
        routes,
        header: {
            locale,
            identity: appIdentity,
            brand: {
                name: t("app.title")
            }
        },
        navigation: {
            id: "app-navigation",
            trigger: t("app.navigationTrigger"),
            locale
        },
        breadcrumbs: {
            label: t("app.breadcrumbsLabel")
        },
        search: {
            label: t("app.searchLabel"),
            placeholder: t("app.searchPlaceholder")
        },
        commands: {
            trigger: t("app.commandsTrigger"),
            title: t("app.commandsTitle"),
            searchLabel: t("app.commandsSearchLabel")
        },
        navigationReturnLink: {
            text: t("app.backToNavigation"),
            href: "#app-navigation"
        }
    }),
    diagnostics: {
        localeOptions: {
            requiredMessages: appRequiredMessageKeys
        },
        logOnRouteChange: true
    }
});
```

## Purpose

`createPublicHashAppTemplate()` sits above `PublicHashRoutedApp` and below future app generators. It is still code-first and explicit, but it removes repeated glue from normal public SPAs.

The template owns:

- creating `PublicHashRoutedApp`;
- default quiet startup options: no first-load announcement, no forced initial scroll, no first-load focus jump;
- default `mainId: "main"` and `theme: "system"`;
- passing a compatible app locale into `AppShell` fallback text;
- refreshing shell title, skip-link text, navigation label, and metadata during locale refresh;
- creating a `createHashAppRouteChromeRenderer(...)` callback from declarative route chrome options;
- passing a full `LocaleController` to diagnostics when available and not already supplied.

The application still owns:

- routes and screen rendering;
- all visible and spoken text;
- translations;
- app identity and metadata content;
- route chrome choices;
- footer/content slots;
- custom diagnostics configuration.

## Options

`createPublicHashAppTemplate()` accepts the same public app options as `createPublicHashRoutedApp()`, except that `shell` and `renderChrome` are replaced by template-friendly options.

- `routes` - required hash routes.
- `mount` - optional mount target, such as `"#app"`.
- `locale` - optional locale controller used for locale refresh and, when compatible, shell fallback text.
- `identity` - optional public app identity used by metadata, diagnostics, and manifest helpers.
- `routeMetadata` - identity-aware route metadata defaults, or `false`.
- `shell` - `PublicHashAppTemplateShellOptions`.
- `routeChrome` - static route chrome options, a route chrome resolver, or `false` to omit managed route chrome.
- `onRouteChromeCreate` - optional hook called after route chrome is created.
- `router` - low-level hash router options that still belong to the app, such as `getAnnouncement`.
- `diagnostics` - public diagnostics options, or `false`.
- `startOptions` - optional startup navigation behavior. Defaults to the quiet public-app startup described above.
- `initialScrollReset`, `start`, `localeRefresh`, `refreshChromeOnRouteChange`, `destroyOnPageHide` - passed through to lower layers.

Shell options are normal `AppShell` options, with these additions:

- `title` can be a string or zero-argument resolver.
- `skipLink` can be a string/boolean or resolver.
- `navigationLabel` can be a string or resolver.
- `metadata` can be metadata, `false`, or a resolver.

Use resolvers for localized shell text so the template can refresh them when the locale changes.

## When To Use Lower Layers

Use `PublicHashAppTemplate` for normal public SPAs.

Use `PublicHashRoutedApp` when the app needs to assemble `renderChrome` manually but still wants public diagnostics and startup scroll reset.

Use `HashRoutedApp` when the app is private/internal or does not need public metadata and diagnostics recipes.

Use `HashRouter` directly when the app does not use `AppShell`.

## Accessibility

The template does not invent accessibility text. It makes it easier to keep existing accessibility text fresh across locale changes.

Keep `skipLinkTargetId` aligned with the generated navigation id when the first skip target should be navigation. Use `navigationReturnLink` in `routeChrome` when users need a visible route back to navigation after screen content.

The default first-load behavior is intentionally quiet because route content is already visible after startup. Route changes should still announce and focus through the router/page outlet options chosen by the application.

## Manual Checks

- The initial route renders without a first-load focus jump.
- Route changes still move focus to useful content and announce route changes when configured.
- Locale changes refresh shell title, skip-link text, navigation label, metadata, and route chrome without a page reload.
- Diagnostics include locale checks when a full `LocaleController` is passed.
- Navigation, search, commands, breadcrumbs, and return-to-navigation link still share the same route activation behavior.
