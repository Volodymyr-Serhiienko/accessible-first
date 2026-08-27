# AppIdentity

AppIdentity keeps stable public app identity in one typed object and lets metadata, manifest, diagnostics, routing, and app chrome reuse the same source of truth.

Use it when an application needs consistent name, short name, descriptions, theme color, icons, manifest link, categories, and SoftwareApplication metadata without repeating those values across setup files.

## Quick Start

```ts
const appIdentity = createAppIdentity({
    name: "Language Studio",
    shortName: "Studio",
    description: "An accessible app for learning foreign languages.",
    themeColor: "#102033",
    manifestHref: "site.webmanifest",
    icons: {
        svg: "assets/logo.svg",
        png192: "assets/logo-192.png",
        png512: "assets/logo-512.png"
    },
    categories: ["education", "productivity"],
    softwareApplication: {
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web"
    }
});

const metadata = createAppIdentityDocumentMetadata(appIdentity, {
    lang: locale.getLocale(),
    url: new URL(".", window.location.href),
    robots: "index, follow"
});

const routeOptions = {
    baseUrl: new URL(".", window.location.href),
    getDescription(route) {
        return t(`route.${route.id}.description`);
    }
};

const routeMetadata = createAppIdentityRouteDocumentMetadata(appIdentity, route, routeOptions);
const routeDiagnosticsOptions = createAppIdentityRouteDiagnosticsOptions(appIdentity, routeOptions);

const manifest = createAppIdentityWebAppManifest(appIdentity, {
    lang: "en",
    dir: "ltr",
    id: "."
});
```

## Purpose

Real apps often repeat identity values in several places:

- visible brand and header copy;
- document title and meta description;
- Open Graph and Twitter/X preview metadata;
- JSON-LD SoftwareApplication data;
- web app manifest fields;
- diagnostics and public-web checks.

`createAppIdentity()` does not make application copy global or unlocalizable. It gives the app one stable baseline, then route, locale, deployment, or screen code can override the pieces that need to change.

## Defaults

`createAppIdentity()` applies small identity defaults:

- `shortName` defaults to `name`;
- `socialDescription` defaults to `description`;
- `twitterDescription` defaults to `socialDescription`, then `description`;
- `softwareDescription` defaults to `description`;
- `backgroundColor` defaults to `themeColor`;
- missing optional values normalize to `null` or an empty readonly array.

`createAppIdentityDocumentMetadata()` maps identity values to `createAppDocumentMetadata()`:

- `name`, `description`, `lang`, `url`, `themeColor`, `manifestHref`, SVG icon, preview image, image alt text, social descriptions, and SoftwareApplication defaults;
- app or route code can override any metadata field through the second argument.

`createAppIdentityRouteDocumentMetadata()` maps identity values to route metadata:

- app title, base URL, route title, route description resolver, canonical URL, and generated WebPage JSON-LD;
- route metadata and explicit resolvers still override generated defaults.

`createAppIdentityRouteDiagnosticsOptions()` maps the same identity-aware route defaults to public route diagnostics, including generated document titles, canonical URL checks, and generated WebPage JSON-LD checks.

`createAppIdentityWebAppManifest()` maps identity values to `createAppWebAppManifest()`:

- `name`, `shortName`, `description`, `lang`, `dir`, `themeColor`, `backgroundColor`, categories, and generated icon set;
- deployment code can override manifest fields through the second argument.

`createPublicAppDiagnosticsRunner()` and public routed app recipes can also use `identity` to create the manifest diagnostics source automatically, while `identityManifestOptions` keeps deployment-specific manifest values explicit. Public routed app recipes accept top-level `identity` and `routeMetadata` so document titles, route descriptions, canonical URLs, generated `WebPage` JSON-LD, and route diagnostics can share the same source of truth.


## Route Metadata

`createAppIdentityRouteDocumentMetadata(identity, route, options)` combines an `AppIdentity` with one route descriptor. It uses the identity name as the default app title, uses `identity.url` as the default base URL when available, and generates Schema.org `WebPage` JSON-LD when `getStructuredData` is not provided.

```ts
const metadata = createAppIdentityRouteDocumentMetadata(appIdentity, route, {
    baseUrl: new URL(".", window.location.href),
    getDescription(route) {
        return t(`route.${route.id}.description`);
    }
});
```

Use `createAppIdentityRouteDocumentMetadataOptions(identity, options)` when route metadata should share identity defaults but route code will call `createAppRouteDocumentMetadata()` itself.

Use `createAppIdentityRouteDiagnosticsOptions(identity, options)` when public route diagnostics should inspect the same metadata defaults. This keeps app title, base URL, route descriptions, canonical URLs, and generated `WebPage` JSON-LD aligned without duplicating resolver code.

Additional route metadata options:

- `webPageStructuredData` - set to `false` to skip generated `WebPage` JSON-LD when `getStructuredData` is not provided.
- `webSiteName` - WebSite name used by generated `isPartOf`. Defaults to `identity.name`.
- `webSiteUrl` - WebSite URL used by generated `isPartOf`. Defaults to `identity.url`, then `baseUrl`.

Additional route diagnostics options:

- `getParentId` - parent route resolver for hierarchy diagnostics.
- `getDocumentTitle` - diagnostics-only document title resolver. Defaults to the generated route metadata title.
- `requireDescription`, `requireDocumentTitle`, `requireCanonical`, `requireStructuredData` - per-app diagnostics requirements. Public app diagnostics already enables these by default.

## Options

`createAppIdentity()` accepts:

- `name` - required stable product, site, or application name.
- `shortName` - compact app name for manifests and small UI. Defaults to `name`.
- `description` - primary app description.
- `socialDescription` - Open Graph description. Defaults to `description`.
- `twitterDescription` - Twitter/X description. Defaults to `socialDescription`, then `description`.
- `softwareDescription` - SoftwareApplication JSON-LD description. Defaults to `description`.
- `lang` - default language.
- `dir` - default text direction: `ltr`, `rtl`, or `auto`.
- `url` - public app URL.
- `themeColor` - shared metadata and manifest theme color.
- `backgroundColor` - manifest background color. Defaults to `themeColor`.
- `manifestHref` - web app manifest link used by document metadata.
- `logoAlt` - shared app icon alt text for preview metadata.
- `icons.svg` - SVG app icon.
- `icons.png192` - 192x192 PNG app icon.
- `icons.png512` - 512x512 PNG app icon.
- `icons.preview` - shared social preview image when it should differ from app icons.
- `categories` - web app manifest categories.
- `softwareApplication` - Schema.org SoftwareApplication defaults, or `false`/`null` to omit them.

## Overrides

Use overrides when route, locale, or deployment code needs more specific values. Metadata overrides accept the same app-level fields as `createAppDocumentMetadata()`, including `lang`, `title`, `description`, `canonical`, `siteName`, social metadata, icons, and structured data:

```ts
createAppIdentityDocumentMetadata(appIdentity, {
    name: t("app.name"),
    title: t("route.lessons.title"),
    description: t("route.lessons.description"),
    canonical: new URL("lessons", appIdentity.url ?? window.location.href)
});
```

```ts
createAppIdentityWebAppManifest(appIdentity, {
    startUrl: "/app/",
    scope: "/app/",
    display: "standalone"
});
```

Keep stable identity data in one app-owned module. Keep translatable screen text in locale files and pass localized overrides where the browser or user-visible chrome needs the active language.

## Manual Checks

- Metadata, manifest, and app header use the same app name and short name.
- Public descriptions do not drift between document metadata and manifest setup.
- Icons referenced by metadata and manifest exist in the deployed public path.
- Localized metadata overrides still use the same identity baseline.
- Route metadata helpers still produce canonical URLs and WebPage JSON-LD from the shared identity.
- Public diagnostics remain healthy after changing identity fields.
