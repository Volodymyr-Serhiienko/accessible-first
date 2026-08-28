# PublicLinkAppTemplate

PublicLinkAppTemplate is the high-level Accessible First template for public native-link and MPA pages. It creates a public link-routed app from app-owned routes, shell text, route chrome, metadata, locale, and diagnostics options.

Use it when a static page, server-rendered page, or multi-page app should keep normal browser navigation but still share the same app shell, route chrome, public metadata, diagnostics, and localization patterns as Accessible First SPAs.

## Quick Start

```ts
const app = createPublicLinkAppTemplate({
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
        content: CurrentPageContent(),
        outletOptions: () => ({
            label: t("app.contentLabel")
        }),
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
    matchLocation: {
        matchMode: "pathname",
        baseUrl: window.location.origin
    },
    routeChrome: () => ({
        routes,
        header: {
            locale,
            identity: appIdentity,
            brand: {
                href: "/",
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
        }
    }),
    diagnostics: {
        logOnCreate: true,
        logOnRefresh: true
    }
});
```

## Purpose

`createPublicLinkAppTemplate()` sits above `PublicLinkRoutedApp` and below future app generators. It is code-first and explicit, but it removes repeated glue from normal public native-link apps.

The template owns:

- creating `PublicLinkRoutedApp`;
- default `mainId: "main"` and `theme: "system"`;
- passing a compatible app locale into `AppShell` fallback text;
- refreshing shell title, skip-link text, navigation label, outlet options, and metadata during locale refresh;
- creating a `createLinkAppRouteChromeRenderer(...)` callback from declarative route chrome options;
- passing a full `LocaleController` to diagnostics when available and not already supplied.

The application still owns:

- routes and current-page content;
- real hrefs and server/static navigation behavior;
- all visible and spoken text;
- translations;
- app identity and metadata content;
- route chrome choices;
- footer/content slots;
- custom diagnostics configuration.

## Options

`createPublicLinkAppTemplate()` accepts the same public app options as `createPublicLinkRoutedApp()`, except that `shell` and `renderChrome` are replaced by template-friendly options.

- `routes` - required route descriptors.
- `mount` - optional mount target, such as `"#app"`.
- `locale` - optional locale controller used for locale refresh and, when compatible, shell fallback text.
- `identity` - optional public app identity used by metadata, diagnostics, and manifest helpers.
- `routeMetadata` - identity-aware route metadata defaults, or `false`.
- `shell` - `PublicLinkAppTemplateShellOptions`.
- `routeChrome` - static route chrome options, a route chrome resolver, or `false` to omit managed route chrome.
- `onRouteChromeCreate` - optional hook called after route chrome is created.
- `current`, `location`, `matchLocation` - native-link route matching options passed through to `LinkRoutedApp`.
- `diagnostics` - public diagnostics options, or `false`.
- `localeRefresh`, `destroyOnPageHide`, `mountOptions` - passed through to lower layers.

Shell options are normal `AppShell` options, with these additions:

- `title` can be a string or zero-argument resolver.
- `skipLink` can be a string/boolean or resolver.
- `navigationLabel` can be a string or resolver.
- `metadata` can be metadata, `false`, or a resolver.
- `outletOptions` can be PageOutlet options or a zero-argument resolver.

Use resolvers for localized shell text and outlet labels so the template can refresh them when the locale changes.

## When To Use Lower Layers

Use `PublicAppTemplate` for the standard one-entry public app API. Use `PublicLinkAppTemplate` when the code or docs should be explicitly native-link or MPA-only.

Use `PublicLinkRoutedApp` when the page needs to assemble `renderChrome` manually but still wants public diagnostics and route metadata defaults.

Use `LinkRoutedApp` when the app is private/internal or does not need public metadata and diagnostics recipes.

Use `PublicHashAppTemplate` for hash-routed SPAs that render screens into a `PageOutlet` without normal page loads.

## Accessibility

The template keeps route navigation based on real anchor hrefs. That is important for browser behavior, copyable links, static hosting, server-rendered pages, and assistive technology expectations.

Keep `skipLinkTargetId` aligned with the generated navigation id when the first skip target should be navigation. For native-link pages, every route should expose a meaningful current state, document title, description, and href so navigation, breadcrumbs, search, commands, and diagnostics all describe the same page model.

## Manual Checks

- The current route is detected from the expected URL part.
- Navigation and breadcrumbs mark the current page.
- Native links still navigate normally.
- Route search and command palette selections navigate to route hrefs.
- Locale changes refresh shell title, skip-link text, navigation label, outlet options, metadata, and route chrome on the current page.
- Diagnostics include locale checks when a full `LocaleController` is passed.
