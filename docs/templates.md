# Application Templates

Accessible First templates are small runnable examples that show how to start real applications with the framework. They are not playground demos and they are not a generator yet.

A template should answer one question: how does a developer begin with accessible structure, theme, localization, metadata, diagnostics, and useful defaults without writing large amounts of app glue?

## Current Template

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

## Next Template

### `examples/minimal-static-public-site`

This is the next planned starter. It should be a simpler public site/page template for static pages, landing pages, small information sites, and lightweight pages that do not need SPA route changes.

It should still use Accessible First foundations:

- app identity;
- metadata and public-page helpers;
- theme support;
- localization structure where useful;
- semantic page content;
- footer;
- diagnostics;
- a local override stylesheet.

It should avoid route chrome unless the page really needs navigation.

## Template Rules

- Keep examples small enough to read in one sitting.
- Keep generated-looking code clear, not clever.
- Put application copy in locale files or page content files.
- Keep framework service text in the localization bundle.
- Keep metadata, manifest, route text, and diagnostics connected to the same app identity and route descriptors.
- Prefer `createPublicAppTemplate()` for teachable public app starts.
- Use lower-level APIs only when the template is demonstrating a lower-level pattern on purpose.
- Leave `styles.css` in templates as an app-owned override file, even when it starts empty.

## Path To A Generator

The first generator should come after both starter examples are stable. It should create a minimal runnable app or static site from explicit options such as name, description, colors, logo, locale list, route/page list, and selected chrome controls.

A visual site builder can come later, after real applications prove which options are stable enough to expose visually.
