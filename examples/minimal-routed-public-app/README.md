# Minimal Routed Public App

This example is the first runnable Accessible First application starter.

It is intentionally small. It proves the framework can create a public routed app outside the playground with app identity, metadata, localization, theme control, header tools, route navigation, breadcrumbs, footer, page content, and diagnostics.

## Run

```bash
npm run example:routed:dev
```

Build the standalone example with:

```bash
npm run example:routed:build
```

## What It Demonstrates

- `createPublicAppTemplate()` as the main app entry point.
- Hash-routed SPA behavior with two pages.
- One app identity shared by brand, metadata, manifest, icons, and diagnostics.
- One localization controller for framework service text and app copy.
- Route metadata reused by navigation, breadcrumbs, route announcements, document metadata, search-ready route text, and diagnostics.
- Resolver-backed shell and chrome options so locale changes refresh visible app text without a full page reload.
- A local `styles.css` file reserved for app-specific overrides.

## File Map

```text
examples/minimal-routed-public-app/
  index.html
  main.ts
  styles.css
  public/
    site.webmanifest
    assets/
      logo.svg
      logo-192.png
      logo-512.png
  src/
    app/
      app.ts          # app factory
      chrome.ts       # route chrome options: header, navigation, breadcrumbs, return link
      diagnostics.ts  # app diagnostics options
      footer.ts       # footer content
      header.ts       # header options: brand, language, theme, tools
      identity.ts     # app identity and metadata
      routes.ts       # route descriptors and route metadata options
      routeText.ts    # localized route text resolvers
      shell.ts        # app shell, layout, outlet, footer slot
    localization/
      index.ts        # shared localization controller and helpers
      types.ts        # locale and message-key types
      locales/
        en.ts         # English app messages
        uk.ts         # Ukrainian framework and app messages
    pages/
      home.ts
      about.ts
```

## Change Common Parts

- Brand, name, description, colors, icons, and public metadata: `src/app/identity.ts`.
- Header brand settings, language selector, theme toggle, and header tools: `src/app/header.ts`.
- Navigation, breadcrumbs, route return link, and route chrome composition: `src/app/chrome.ts`.
- Footer content: `src/app/footer.ts`.
- Shell layout, skip link, content region label, and footer slot: `src/app/shell.ts`.
- Routes and route-level metadata: `src/app/routes.ts`.
- Visible page content: `src/pages/`.
- Translations: `src/localization/`.
- App-specific styling overrides: `styles.css`.

## Add A Page

1. Create a page file in `src/pages/`.
2. Add app message keys in `src/localization/types.ts`.
3. Add translations in each file under `src/localization/locales/`.
4. Register the route in `src/app/routes.ts` with fallback text and `localeKeys`.

Fallback route `title`, `label`, `description`, and `keywords` should stay readable even when localization is unavailable. Localized route text supplies the active-language values to navigation, breadcrumbs, metadata, diagnostics, route search, and route announcements.

## Starter Rule

Keep this template minimal. Add forms, command-heavy workflows, data grids, side panels, and advanced search only when a real application needs them. Repeated app wiring should move into the framework; product copy and product behavior should stay in the app.
