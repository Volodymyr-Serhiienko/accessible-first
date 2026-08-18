# DocumentMetadata

DocumentMetadata applies document-level metadata for pages and application shells.

Use it when an app should set a useful document title, language, description, responsive viewport, theme color, and icons from the same composition layer that builds the page.

## Quick Start

```ts
createDocumentMetadata({
    title: "Language App",
    lang: "en",
    description: "Accessible language learning app.",
    viewport: DEFAULT_DOCUMENT_VIEWPORT,
    themeColor: "#111827",
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

`DocumentMetadata` is intentionally small for now. It covers the metadata that almost every real app needs first, while leaving room for later SEO expansion such as canonical links, Open Graph, Twitter cards, manifests, robots, and structured data.

## Options

- `document` - target document. Defaults to the current `document`. Creation-time option.
- `title` - document title.
- `lang` - language for the `html` element.
- `description` - meta description.
- `viewport` - meta viewport. Use `DEFAULT_DOCUMENT_VIEWPORT` for the common responsive default.
- `themeColor` - meta theme color.
- `icons` - managed icon links.

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

Use `metadata: false` only when an integration must fully own document metadata itself.

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
- Icons resolve correctly after deployment, including GitHub Pages base paths.
