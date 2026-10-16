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

See the official [Sitemap protocol](https://www.sitemaps.org/protocol.html) and
[W3C datetime profile](https://www.w3.org/TR/NOTE-datetime).

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

Use `includeRoute` for application-owned public/private policy. The helper does
not infer permissions or noindex from a route; it excludes only disabled routes
by default. `getCanonical` returning `null` also omits the route and skips its
optional sitemap metadata resolvers. A supplied Date (including another realm's
Date) becomes UTC ISO text; an invalid Date throws rather than inventing a date.
Strings remain caller-owned. `lastmod` describes the page's actual modification,
not the time the sitemap was generated.

XML generation escapes all text fields and rejects characters XML 1.0 cannot
represent, including lone surrogates. It does not silently drop bad text or repair
URLs/metadata; run diagnostics before writing deployment artifacts.

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

Duplicate detection compares parsed absolute URL forms (host case/default ports
are normalized), retaining the original entry references in findings. With
`requireSingleHost` (default `true`), host/port and protocol must agree; disabling
it is an explicit relaxed policy, not permission to cross-submit to a search
engine. Credentialed URLs and control characters are errors. Hash targets are
informational unless `allowHash: true`; this does not make them independent pages.

`maxLocLength` defaults to 2047 characters (the protocol requires less than 2048).
A custom positive safe integer overrides it; invalid limits use the default.
`lastmod` accepts W3C year/month/date precision and timezone-qualified timestamps,
with real calendar/day/time checks instead of permissive `Date.parse` rollover.
Optional metadata failures warn; the caller decides its release policy.

This is not full XSD validation. File byte/entry limits, sitemap indexes, URL
percent-encoding, deployment-directory scope, robots/HTTP access and successful
indexing remain deployment checks. The helper never fetches pages or publishes files.

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
- Disabled routes and application-filtered private routes are excluded.
- Every public route that should be indexed appears once.
- `sitemap.xml` is deployed at a location crawlers can access.
- `robots.txt` references the sitemap when the site uses one.
