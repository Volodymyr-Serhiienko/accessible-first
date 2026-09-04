# Application Templates

Accessible First templates are small runnable examples that show how to start real applications with the framework. They are not playground demos and they are not a generator yet.

A template should answer one question: how does a developer begin with accessible structure, theme, localization, metadata, diagnostics, and useful defaults without writing large amounts of app glue?

## Current Templates

### `examples/minimal-routed-public-app`

Use this template for a small public SPA or app-like site that needs client-side route changes.

It includes:

- `createPublicAppTemplate()` in hash mode;
- two routes, page content files, route metadata, and localized route text;
- AppShell, AppHeader, route navigation, breadcrumbs, navigation return link, and footer;
- app identity, document metadata, web app manifest assets, and diagnostics;
- English and Ukrainian localization with framework service text and app copy separated by files;
- an empty local `styles.css` for app-specific overrides.

Run it with:

```bash
npm run example:routed:dev
```

Build it with:

```bash
npm run example:routed:build
```

### `examples/minimal-static-public-site`

Use this template for a public page, small static site, landing page, documentation page, or simple site that does not need client-side route changes.

It includes:

- `createPublicStaticAppTemplate()` as the route-free app entry point;
- one semantic page built with Screen, Section, Stack, and text helpers;
- AppShell, AppHeader, brand, language selector, theme toggle, and footer;
- app identity, document metadata, web app manifest assets, and diagnostics;
- English and Ukrainian localization with framework service text and app copy separated by files;
- an empty local `styles.css` for app-specific overrides.

Run it with:

```bash
npm run example:static:dev
```

Build it with:

```bash
npm run example:static:build
```

## Choosing A Template

Use the static template when the site has one primary page or when normal document flow is enough.

Use the routed template when the app needs route-level content changes, active navigation, breadcrumbs, route search, command palette entries, route announcements, or route metadata automation.

Use native-link or MPA patterns when separate documents, server rendering, or normal browser navigation are the right product shape.

AI agents should read [AI Usage Guide](./ai-usage.md) before generating app code from these templates.

## Template Rules

- Keep examples small enough to read in one sitting.
- Keep generated-looking code clear, not clever.
- Put application copy in locale files or page content files.
- Keep framework service text in the localization bundle.
- Keep metadata, manifest, route text, and diagnostics connected to the same app identity and route descriptors when routes exist.
- Prefer `createPublicStaticAppTemplate()` for route-free public sites.
- Prefer `createPublicAppTemplate()` for routed public app starts.
- Use lower-level APIs only when the template is demonstrating a lower-level pattern on purpose.
- Leave `styles.css` in templates as an app-owned override file, even when it starts empty.

## Path To A Generator

The first generator should come after the starter examples are stable. It should create a minimal runnable app or static site from explicit options such as name, description, colors, logo, locale list, route/page list, and selected chrome controls.

A visual site builder can come later, after real applications prove which options are stable enough to expose visually.
