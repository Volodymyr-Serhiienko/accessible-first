# App Route Sitemap

App Route Sitemap creates sitemap entries and XML from Accessible First route descriptors.

Use it when one route list should drive navigation, search, breadcrumbs, route metadata, diagnostics, and public discovery files such as `sitemap.xml`.

## Quick Start

```ts
const entries = createAppRouteSitemapEntries(routes, {
    baseUrl: "https://example.com/app/"
});

const xml = createAppRouteSitemapXml(entries);
```

With optional sitemap fields:

```ts
const entries = createAppRouteSitemapEntries(routes, {
    baseUrl: "https://example.com/app/",
    getLastModified(route) {
        return route.metadata?.updatedAt ?? null;
    },
    getChangeFrequency(route) {
        return route.id === "home" ? "weekly" : "monthly";
    },
    getPriority(route) {
        return route.id === "home" ? 1 : 0.6;
    }
});
```

## Purpose

A sitemap should not require a separate hand-written list of pages when the application already has route descriptors. The helper keeps sitemap generation close to the same route metadata used for document titles, descriptions, canonical URLs, navigation, search, and breadcrumbs.

Hash routes such as `#settings` can be excellent for in-app navigation, but they are usually not good sitemap targets. Prefer real public URLs for sitemap entries, or provide a custom `getCanonical` / `getHref` resolver that maps app routes to crawlable page URLs.
This is especially useful for:

- static sites and public documentation;
- multi-page applications;
- SPA shells that still expose crawlable route URLs;
- generated deployment artifacts such as `sitemap.xml`.

## Sitemap Protocol

Accessible First follows the standard sitemap shape:

- each entry has a required absolute `loc` URL;
- `lastmod`, `changefreq`, and `priority` are optional;
- XML values are escaped;
- all URLs in one sitemap should belong to one host.

See the official Sitemap protocol: https://www.sitemaps.org/protocol.html

## Options

`createAppRouteSitemapEntries(routes, options)` supports:

- `baseUrl` - base URL used with route hrefs to create absolute sitemap URLs.
- `getHref` - custom route href resolver.
- `getCanonical` - custom canonical URL resolver. Overrides `baseUrl` plus href when provided.
- `includeRoute` - optional filter. Defaults to excluding disabled routes.
- `getLastModified` - resolves `lastmod` from a route.
- `getChangeFrequency` - resolves `changefreq`.
- `getPriority` - resolves `priority` from `0` to `1`.

`createAppRouteSitemapXml(entries, options)` supports:

- `pretty` - formats the XML with line breaks and indentation. Defaults to `true`.

## Diagnostics

Use `inspectAppRouteSitemap(entries)` in development or build scripts:

```ts
const report = inspectAppRouteSitemap(entries);
logAppRouteSitemapDiagnostics(report);
```

Diagnostics check:

- empty sitemap entries;
- duplicate URLs;
- absolute HTTP/HTTPS URL shape;
- URL length;
- single-host consistency;
- invalid `lastmod`, `changefreq`, and `priority` values.

The report shape is compatible with `AppDiagnostics` custom sources.

## AppDiagnostics

```ts
logAppDiagnostics(createAppDiagnosticsReport({
    page: pageReport,
    routes: routeReport,
    sources: [
        {
            id: "sitemap",
            label: "Sitemap",
            report: inspectAppRouteSitemap(entries)
        }
    ]
}));
```

## Manual Checks

- Generated `loc` values are public deployment URLs, not local development URLs.
- Disabled/private routes are excluded.
- Every public route that should be indexed appears once.
- `sitemap.xml` is deployed at a location crawlers can access.
- `robots.txt` references the sitemap when the site uses one.