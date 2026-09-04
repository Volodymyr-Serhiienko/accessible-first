# Application Starter

Application Starter is the practical recipe for creating real Accessible First apps.

It is not a file generator yet. It describes the smallest repeatable app shapes we are proving with runnable examples.

For the architecture contract, see [Application Blueprint](./app-blueprint.md). For the starter list, see [Application Templates](./templates.md).

## Runnable Examples

### Routed Public App

The routed starter lives in `examples/minimal-routed-public-app`.

Run it with:

```bash
npm run example:routed:dev
```

Build it with:

```bash
npm run example:routed:build
```

This example proves a public hash-routed app with brand, header tools, theme, localization, two pages, route navigation, breadcrumbs, footer, metadata, manifest assets, diagnostics, and page content files.

### Static Public Site

The static starter lives in `examples/minimal-static-public-site`.

Run it with:

```bash
npm run example:static:dev
```

Build it with:

```bash
npm run example:static:build
```

This example proves a route-free public site with brand, header tools, theme, localization, one semantic page, footer, metadata, manifest assets, diagnostics, and a small app factory powered by `createPublicStaticAppTemplate()`.

## Starter Goals

A starter should give the developer:

- one clear app factory;
- one app identity;
- one localization controller;
- one shell and chrome setup;
- one route/page declaration model when routing is needed;
- document metadata and public-page defaults;
- diagnostics from the beginning;
- a local stylesheet for app-specific overrides.

The starter should not include every component. It should stay small enough to understand quickly.

## Recommended Routed File Shape

```text
src/
  app/
    app.ts
    chrome.ts
    diagnostics.ts
    footer.ts
    header.ts
    identity.ts
    routes.ts
    routeText.ts
    shell.ts
  localization/
    index.ts
    types.ts
    locales/
      en.ts
      uk.ts
  pages/
    home.ts
    about.ts
main.ts
styles.css
```

## Recommended Static File Shape

```text
src/
  app/
    app.ts
    footer.ts
    header.ts
    identity.ts
    shell.ts
  localization/
    index.ts
    types.ts
    locales/
      en.ts
      uk.ts
  pages/
    home.ts
main.ts
styles.css
```

## Startup

`main.ts` should only import styles and start the app:

```ts
import "../../packages/components/src/styles/index.css";
import "./styles.css";
import { createApp } from "./src/app/app";

createApp();
```

A routed app factory owns route wiring:

```ts
createPublicAppTemplate({
    mode: "hash",
    routes,
    mount: "#app",
    locale,
    identity,
    routeText,
    routeMetadata,
    shell: getShellOptions,
    routeChrome: getChromeOptions,
    diagnostics: getDiagnosticsOptions()
});
```

A static app factory owns route-free shell wiring:

```ts
createPublicStaticAppTemplate({
    mount: "#app",
    locale,
    identity,
    shell: getShellOptions,
    content: HomePage,
    diagnostics: {
        pageOptions: {
            landmarks: {
                requireNavigation: false
            }
        },
        log: true
    }
});
```

## Identity

Keep brand, public metadata, manifest data, icons, colors, and diagnostics identity in `identity.ts`.

Use a resolver when identity depends on locale:

```ts
export function getAppIdentity(): AppIdentity {
    return createAppIdentity({
        name: t("app.name"),
        description: t("app.description"),
        lang: locale.getLocale(),
        manifestHref: "site.webmanifest",
        icons: {
            svg: "assets/logo.svg",
            png192: "assets/logo-192.png",
            png512: "assets/logo-512.png"
        }
    });
}
```

## Localization

Use `src/localization/` for app text and framework service text.

Recommended shape:

- `types.ts` defines supported locales and app message keys;
- `locales/en.ts` contains app English copy;
- non-English locale files contain translated framework service keys plus app copy;
- `index.ts` creates and exports the shared `createAppLocalization()` controller, language items, `t()`, and types.

Browser/system language, saved preference, and explicit app settings should choose the locale. Do not use geographic location as the default language signal.

## Routes

Routes should keep readable fallback text and point to localized keys:

```ts
{
    id: "home",
    title: "Welcome",
    label: "Home",
    description: "A small runnable app shell.",
    localeKeys: {
        title: "routes.home.title",
        label: "routes.home.label",
        description: "routes.home.description",
        keywords: ["routes.home.keywords"]
    },
    screen: {
        title: () => t("routes.home.title"),
        description: () => t("routes.home.description")
    },
    children: HomePage
}
```

Fallback text helps diagnostics, unsupported locales, metadata, and development before translations are complete. Localized route text feeds navigation, breadcrumbs, route search, command palette, route announcements, metadata, and diagnostics.

## Shell

The shell owns page structure and stable regions:

```ts
export function getShellOptions(): PublicStaticAppTemplateShellOptions {
    return {
        title: () => t("app.name"),
        skipLink: () => t("shell.skipLink"),
        metadata: getAppMetadata,
        header: Header,
        footer: Footer,
        outletOptions: () => ({
            label: t("shell.contentLabel"),
            announcement: false,
            scrollOnRender: false
        }),
        layout: {
            chrome: "normal",
            maxWidth: "64rem",
            gutter: "clamp(1rem, 5vw, 2rem)",
            mainGap: "1rem"
        }
    };
}
```

Use resolver functions for localized shell text and slot content so locale changes refresh without a full page reload.

## Chrome

Route chrome owns header, route navigation, breadcrumbs, route search, command palette, and return-to-navigation links.

Use explicit options when the app needs to show which header tools are enabled:

```ts
export function getChromeOptions() {
    return {
        header: getHeaderOptions(),
        navigation: {
            id: "app-navigation"
        },
        breadcrumbs: {},
        navigationReturnLink: {
            href: "#app-navigation",
            text: t("navigation.returnLink"),
            variant: "standalone",
            scroll: true
        }
    };
}
```

Use `routeChrome: true` only when defaults are enough and the app does not need explicit header/chrome settings.

## Pages

Keep page files focused on content:

```ts
export function HomePage(): CompositionContent {
    return Screen({
        title: t("home.title"),
        description: t("home.description"),
        descriptionMode: "content",
        headingLevel: 1,
        children: [
            Section({
                title: t("home.start.title"),
                children: [P(t("home.start.p1"))]
            })
        ]
    });
}
```

When content becomes dynamic, keep repeated behavior in framework helpers and product behavior in app feature modules.

## Diagnostics

Diagnostics should be enabled from the start. Public app templates can infer localization diagnostics when the shared app localization controller is passed as `locale`.

Keep diagnostics strict for templates so missing metadata, manifest, route, localization, and page structure problems are visible early. Configure intentional omissions explicitly, such as `requireNavigation: false` for a route-free static site.

## Local CSS

Template `styles.css` is intentionally kept even when it starts empty. Standard body, footer, shell, component, focus, theme, and responsive defaults should live in the library. App CSS should be used for product-specific branding, spacing adjustments, and custom screen design.

## Next Step

After the routed and static starters are stable, add concise AI-friendly repository guidance and then bring in the first reference app.
