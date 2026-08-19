# DocumentMetadata

DocumentMetadata applies document-level metadata for pages and application shells.

Use it when an app should set a useful document title, language, description, responsive viewport, theme color, canonical URL, robots, manifest, and icons from the same composition layer that builds the page.

## Quick Start

```ts
createDocumentMetadata({
    title: "Language App",
    lang: "en",
    description: "Accessible language learning app.",
    viewport: DEFAULT_DOCUMENT_VIEWPORT,
    themeColor: "#111827",
    canonical: "https://example.com/app",
    robots: "index, follow",
    manifest: "site.webmanifest",
    icons: [
        { href: "assets/logo.svg", type: "image/svg+xml" }
    ]
});
```

With AppShell:

```ts
AppShell({
    title: "Language App",
    metadata: {
        lang: "en",
        description: "Accessible language learning app.",
        themeColor: "#111827",
        icons: [{ href: "assets/logo.svg", type: "image/svg+xml" }]
    }
});
```

## Purpose

Document metadata is part of page health. It helps browsers, assistive technology, search engines, saved shortcuts, and mobile devices understand the app.

`DocumentMetadata` is intentionally small. It covers the metadata that almost every real app needs first, while leaving richer social previews and structured data for later expansion.

## Options

- `document` - target document. Defaults to the current `document`. Creation-time option.
- `title` - document title.
- `lang` - language for the `html` element.
- `description` - meta description.
- `viewport` - meta viewport. Use `DEFAULT_DOCUMENT_VIEWPORT` for the common responsive default.
- `themeColor` - meta theme color.
- `canonical` - canonical page URL as a string or `URL`.
- `robots` - meta robots policy, such as `"index, follow"` or `"noindex, nofollow"`.
- `manifest` - web app manifest URL, or manifest options with `crossOrigin`.
- `icons` - managed icon links.

## Manifest Options

When `manifest` is an object, it supports:

- `href` - manifest URL.
- `crossOrigin` - optional crossorigin value: `""`, `"anonymous"`, or `"use-credentials"`.

```ts
createDocumentMetadata({
    manifest: {
        href: "site.webmanifest",
        crossOrigin: "anonymous"
    }
});
```

## Icon Options

- `href` - icon URL.
- `rel` - link relation. Defaults to `"icon"`.
- `type` - icon MIME type, such as `"image/svg+xml"`.
- `sizes` - icon sizes.
- `media` - media query.
- `color` - color value for mask icons.

## Methods

- `update(options)` - updates metadata at runtime.
- `destroy()` - restores the previous document title, language, managed meta tags, and managed icons.

## AppShell And Page

`createPage()` accepts `metadata`. If `title` is provided and `metadata.title` is not set, the page title is reused as the metadata title.

`AppShell()` passes `metadata` to `createPage()`, so application shells can define document metadata without separate setup code.

Both `Page` and `AppShell` expose `updateMetadata(options)` for route changes, screen changes, and app state changes that need to update document metadata at runtime.

Use `metadata: false` only when an integration must fully own document metadata itself.

## Route Metadata

Use App Route helpers when route descriptors should derive document metadata:

```ts
const metadata = createAppRouteDocumentMetadata(route, {
    appTitle: "Language App"
});

shell.updateMetadata(metadata);
```

`HashRouter` can call this automatically through `getDocumentMetadata` and `updateDocumentMetadata`.

## Diagnostics

`page.inspect()` checks basic document metadata:

- document title;
- `html[lang]`;
- viewport meta;
- description meta.

Private internal apps may not need every SEO-oriented field, but public pages should provide meaningful metadata.

## Manual Checks

- Browser tab title is meaningful.
- Screen reader announces the document language correctly.
- Mobile viewport uses responsive width.
- Public pages have a concise meta description.
- Public pages have a canonical URL when duplicate URLs may exist.
- Robots policy matches the app/page visibility goal.
- Manifest resolves correctly when the app should be installable or saved to a device.
- Icons resolve correctly after deployment, including GitHub Pages base paths.



