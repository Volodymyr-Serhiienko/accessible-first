# RobotsTxt

RobotsTxt creates and inspects `robots.txt` content for public Accessible First applications.

Use it with `DocumentMetadata`, `WebAppManifest`, and App Route Sitemap when an app needs deployable public discovery files, not only runtime metadata in the document head.

## Quick Start

```ts
const robots = createRobotsTxt({
    groups: [
        {
            userAgent: "*",
            allow: ["/"]
        }
    ],
    sitemaps: ["https://example.com/sitemap.xml"]
});
```

For a private preview or staging deployment:

```ts
const robots = createRobotsTxt({
    groups: [
        {
            userAgent: "*",
            disallow: ["/"]
        }
    ]
});
```

## Purpose

A real web application often needs both runtime metadata and static deployment artifacts:

- document metadata for browsers, assistive technology, and social previews;
- web app manifest for installability;
- sitemap XML for public page discovery;
- `robots.txt` for crawler access guidance and sitemap location.

RobotsTxt keeps this small and explicit. It does not try to be an access-control feature. Private content must still be protected by authentication and server rules.

## Protocol Notes

Accessible First follows the Robots Exclusion Protocol shape from RFC 9309:

- rules are grouped by `User-agent`;
- each group can contain `Allow` and `Disallow` path rules;
- `Sitemap` lines can be added as additional records;
- a group without rules allows access by default.

The generator emits an empty `Disallow:` for a group with no rules. This preserves
the intended unrestricted group before the next user-agent: blank lines/comments
alone do not separate consecutive user-agent declarations. An explicit empty
path is otherwise preserved, and path case/wildcards are not rewritten.

See [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2).

## Options

`createRobotsTxt(options)` supports:

- `comments` - optional comments written as `# ...` lines at the top.
- `groups` - crawler rule groups.
- `sitemaps` - absolute sitemap URLs.
- `trailingNewline` - appends a final newline. Defaults to `true`.

Each group supports:

- `userAgent` - one user-agent or a list of user-agents. Use `"*"` for all crawlers.
- `allow` - allowed path patterns.
- `disallow` - disallowed path patterns.
- `comments` - optional comments before the group.

## Diagnostics

Use `inspectRobotsTxtOptions(options)` before writing the file:

```ts
const report = inspectRobotsTxtOptions({
    groups: [{ userAgent: "*", allow: ["/"] }],
    sitemaps: ["https://example.com/sitemap.xml"]
});

logRobotsTxtDiagnostics(report);
```

Diagnostics check:

- missing groups when `requireGroup` is enabled;
- missing sitemap URLs when `requireSitemap` is enabled;
- empty or invalid user-agent tokens;
- invalid path rule shape;
- duplicate sitemap URLs;
- sitemap URL protocol.

Line breaks in user-agent/rule/sitemap values are errors. Literal `#` in a path
warns because it starts a comment; use `%23` for a literal path character.
Credentialed sitemap URLs are errors; document fragments warn. Generation keeps
each value on one line but does not replace validation: inspect options before
publishing and reject blocked reports. Comments may be multiline input and are
flattened to one comment line. These helpers do not fetch URLs, evaluate matching
rules or implement a crawler. A healthy report does not prove crawlability.

The report shape is compatible with `AppDiagnostics` custom sources.

## Manual Checks

- Production deployments use public HTTP/HTTPS sitemap URLs.
- Preview deployments do not accidentally allow indexing when they should be private.
- `robots.txt` is deployed at the site root.
- `robots.txt` does not include secrets or private URLs.
- Private data is protected by real access control, not only by crawler instructions.
- Disallow is not a noindex/removal guarantee. Keep authentication and indexing
  policy separate; a crawler cannot read a page's noindex directive if crawling
  that page is blocked.
