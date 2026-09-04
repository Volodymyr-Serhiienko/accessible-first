# Minimal Static Public Site

This example is the smallest route-free Accessible First public site starter.

It is intentionally compact. It proves the framework can create a public static page outside the playground with app identity, metadata, localization, theme control, header tools, footer, semantic page content, and diagnostics.

## Run

```bash
npm run example:static:dev
```

Build the standalone example with:

```bash
npm run example:static:build
```

## What It Demonstrates

- `createPublicStaticAppTemplate()` as the route-free app entry point.
- One semantic page rendered through AppShell and PageOutlet.
- One app identity shared by brand, metadata, manifest, icons, and diagnostics.
- One localization controller for framework service text and app copy.
- Resolver-backed shell, header, footer, metadata, and content so locale changes refresh visible app text without a full page reload.
- A local `styles.css` file reserved for app-specific overrides.

## File Map

```text
examples/minimal-static-public-site/
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
      app.ts       # app factory
      footer.ts    # footer content
      header.ts    # header options: brand, language, theme, tools
      identity.ts  # app identity and metadata
      shell.ts     # app shell, layout, outlet, header, footer
    localization/
      index.ts     # shared localization controller and helpers
      types.ts     # locale and message-key types
      locales/
        en.ts      # English app messages
        uk.ts      # Ukrainian framework and app messages
    pages/
      home.ts      # route-free page content
```

## Change Common Parts

- Brand, name, description, colors, icons, and public metadata: `src/app/identity.ts`.
- Header brand settings, language selector, theme toggle, and header tools: `src/app/header.ts`.
- Footer content: `src/app/footer.ts`.
- Shell layout, skip link, content region label, and footer slot: `src/app/shell.ts`.
- Visible page content: `src/pages/home.ts`.
- Translations: `src/localization/`.
- App-specific styling overrides: `styles.css`.

## When To Use This Starter

Use this starter for a public page, small information site, landing page, documentation page, portfolio, or lightweight product page that does not need client-side route changes.

If the site needs active navigation, breadcrumbs, route search, command palette entries, route announcements, or route metadata automation, use `examples/minimal-routed-public-app` instead.

## Starter Rule

Keep this template minimal. Add navigation, forms, data views, and command-heavy workflows only when the site needs them. Repeated app wiring should move into the framework; product copy and product behavior should stay in the app.
