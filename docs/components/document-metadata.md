# DocumentMetadata

DocumentMetadata applies document-level metadata for pages and application shells.

Use it when an app should set a useful document title, language, description, responsive viewport, theme color, canonical URL, robots, manifest, social preview metadata, structured data, and icons from the same composition layer that builds the page.

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
    openGraph: {
        title: "Language App",
        type: "website",
        url: "https://example.com/app",
        image: {
            url: "https://example.com/social-preview.png",
            alt: "Language App preview"
        }
    },
    twitter: {
        card: "summary_large_image",
        title: "Language App",
        image: "https://example.com/social-preview.png",
        imageAlt: "Language App preview"
    },
    structuredData: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Language App",
        applicationCategory: "EducationalApplication"
    },
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

`DocumentMetadata` is intentionally small. It covers the metadata that almost every real app needs first, while leaving deeper SEO checks for later expansion.

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
- `openGraph` - Open Graph preview metadata for shared links.
- `twitter` - Twitter/X card preview metadata for shared links.
- `structuredData` - JSON-LD data inserted as `script[type="application/ld+json"]`.
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

Use [WebAppManifest](./web-app-manifest.md) when you also want a typed helper for creating the manifest JSON content.

## Social Preview Options

Open Graph metadata supports the common preview fields:

- `title` - shared object title. Falls back to the document title when omitted by application code only if the app provides that value itself.
- `type` - object type, usually `"website"` for app pages.
- `url` - canonical shared URL.
- `description` - shared preview description.
- `siteName` - site or product name.
- `locale` - locale such as `"en_US"`.
- `image` - preview image URL or image options with `secureUrl`, `type`, `width`, `height`, and `alt`.

Twitter/X metadata supports:

- `card` - card type, usually `"summary"` or `"summary_large_image"`.
- `site` - site account handle.
- `creator` - author account handle.
- `title` - card title.
- `description` - card description.
- `image` - card image URL.
- `imageAlt` - accessible description for the card image.

Use absolute HTTPS image URLs for public social previews. Relative URLs can work inside the app but are often not enough for external crawlers.

## Structured Data

Use `structuredData` for JSON-LD that describes a public page or app to search engines and other consumers:

```ts
createDocumentMetadata({
    structuredData: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Language App",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web"
    }
});
```

`DocumentMetadata` serializes the value into a managed `script[type="application/ld+json"]` element. Pass `null` to remove the managed structured data during a runtime update.

The helper intentionally keeps structured data generic. Schema.org has many types, and real apps should choose the schema that matches the page: `WebSite`, `SoftwareApplication`, `Article`, `Course`, `FAQPage`, or another appropriate type.

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

`page.inspect()` checks document metadata and can enforce stricter public-page requirements:

- document title;
- `html[lang]`;
- viewport meta;
- description meta;
- canonical link shape when present;
- robots meta shape when present;
- manifest link shape when present;
- Open Graph and Twitter/X preview metadata when required;
- JSON-LD structured data presence and JSON validity when required.

Private internal apps may not need every SEO-oriented field. Public pages can enable stricter checks:

```ts
shell.inspect({
    log: false,
    documentMetadata: {
        requireDescription: true,
        requireCanonical: true,
        requireRobots: true,
        requireManifest: true,
        requireOpenGraph: true,
        requireTwitter: true,
        requireStructuredData: true
    }
});
```

## Manual Checks

- Browser tab title is meaningful.
- Screen reader announces the document language correctly.
- Mobile viewport uses responsive width.
- Public pages have a concise meta description.
- Public pages have a canonical URL when duplicate URLs may exist.
- Robots policy matches the app/page visibility goal.
- Manifest resolves correctly when the app should be installable or saved to a device.
- Open Graph and Twitter/X preview tags use meaningful titles, descriptions, URLs, and image alt text.
- JSON-LD structured data is valid JSON and uses an appropriate Schema.org type for the page.
- Icons resolve correctly after deployment, including GitHub Pages base paths.









