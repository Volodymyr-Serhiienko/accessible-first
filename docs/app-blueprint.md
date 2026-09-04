# Application Blueprint

The application blueprint is the architecture contract for real Accessible First applications.

It is not a generator yet. It describes the shape we want starters, playground app wiring, and the first reference app to follow until real use proves a better abstraction.

## Goal

A new Accessible First application should start with reliable foundations:

- one app identity shared by brand, metadata, manifest, diagnostics, and public-page helpers;
- one locale controller for framework service text and application copy;
- one route/page declaration model used by navigation, breadcrumbs, search, commands, metadata, diagnostics, and safe lookup;
- one public app template selected as hash SPA or native-link/static/MPA;
- one shell with header, navigation, main content, optional before/after outlet content, and footer;
- predictable focus movement for desktop keyboard and mobile screen reader users;
- diagnostics that report page, route, metadata, localization, manifest, and app-owned health issues.

The app owns product text, product data, and product behavior. The framework owns repeated accessibility wiring, responsive shell behavior, metadata plumbing, diagnostics, and useful defaults.

## Recommended Files

```text
src/
  main.ts
  app/
    app.ts
    identity.ts
    header.ts
    chrome.ts          # routed apps only when route chrome needs explicit options
    shell.ts
    routes.ts          # routed apps
    routeText.ts       # localized route text for routed apps
    diagnostics.ts
    footer.ts
  localization/
    index.ts
    types.ts
    locales/
      en.ts
      uk.ts
  pages/
    home.ts
    about.ts
  styles.css
```

Small apps can merge files at first. Split them when the app factory stops being easy to scan.

## Runtime Shape

`main.ts` should stay thin:

```ts
import "./styles.css";
import { createApp } from "./src/app/app";

createApp();
```

The app factory should use `createPublicAppTemplate()` for teachable public app starts:

```ts
createPublicAppTemplate({
    mode: "hash",
    routes,
    mount: "#app",
    locale,
    identity,
    routeText,
    routeMetadata,
    shell: getShellOptions(),
    routeChrome: getChromeOptions,
    diagnostics: getDiagnosticsOptions()
});
```

Use hash mode for client-rendered SPA behavior. Use link mode or a static page starter when normal browser navigation or static pages are a better fit.

## Declarations

Identity should be app-owned and reused by header brand defaults, document metadata, manifest, icons, and diagnostics.

Localization should keep framework service text and app copy in one controlled place, usually with separate files per locale. Non-English apps should translate the framework service keys they use.

Routes should keep readable fallback `title`, `label`, `description`, and `keywords`. Localized route text should provide active-language values for navigation, breadcrumbs, search, route announcements, metadata, and diagnostics.

Shell and chrome options should use resolver functions for locale-dependent values. That lets public app templates refresh app-owned text without a full page reload.

## Screens

Use framework primitives before custom wrappers:

- `Screen` for route-level content;
- `Section`, `Panel`, `Stack`, `Row`, `Grid`, and `Container` for layout;
- `ResultSummary`, `Pagination`, `Table`, `ListDetail`, and form components for data workflows;
- `ToastViewport`, `Dialog`, and `AlertDialog` for feedback and decisions.

Move route body content into `src/pages/` when inline route declarations become hard to scan.

## Templates

The current routed starter is `examples/minimal-routed-public-app`. It proves the blueprint outside the playground.

The next starter should be `examples/minimal-static-public-site`, a smaller static/public-site shape without SPA route machinery.

See [templates.md](./templates.md) and [app-starter.md](./app-starter.md) for practical starter guidance.

## Diagnostics

Every public app should run diagnostics during development and before deployment:

- page landmarks and content structure;
- route labels, hrefs, descriptions, titles, parents, and metadata;
- localization dictionaries and required keys;
- identity, manifest, icons, metadata, sitemap, and robots readiness;
- app-owned health checks when a feature has required data or configuration.

Diagnostics should be useful rather than noisy. Intentional omissions should be configured explicitly.

## Promotion Rule

Do not move code into the framework just because it exists once.

Promote code when it is repeated, accessibility-related, independent of product copy/data, stable enough to document, and useful for both beginners and experienced developers.

## First Reference App

The first reference application will be an accessible foreign-language learning app. It should validate lessons, vocabulary, practice, settings, progress, forms, localization, desktop keyboard routes, and mobile screen reader routes.

Bring in the legacy app after the routed and static starters are stable enough to guide the migration.
