# WebAppManifest

WebAppManifest creates typed web app manifest objects and JSON strings for public apps, installable apps, and saved mobile shortcuts.

Use it when an application needs a `site.webmanifest` file that describes the app name, launch URL, display mode, colors, icons, categories, and optional shortcuts.

## Quick Start

For a normal public app or installable app-like site, start with `createAppWebAppManifest()`:

```ts
const manifest = createAppWebAppManifest({
    name: "Language App",
    shortName: "Language",
    description: "Accessible foreign-language learning app.",
    lang: "en",
    themeColor: "#111827",
    categories: ["education", "productivity"],
    iconSet: {
        svg: "assets/logo.svg",
        png192: "assets/icon-192.png",
        png512: "assets/icon-512.png"
    }
});

const json = stringifyWebAppManifest(manifest);
```

Use `createWebAppManifest()` directly when every manifest member should be spelled out:

```ts
const manifest = createWebAppManifest({
    name: "Language App",
    shortName: "Language",
    description: "Accessible foreign-language learning app.",
    startUrl: ".",
    scope: ".",
    display: "standalone",
    themeColor: "#111827",
    backgroundColor: "#111827",
    icons: [
        {
            src: "assets/icon-192.png",
            sizes: "192x192",
            type: "image/png"
        },
        {
            src: "assets/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
        }
    ]
});

const json = stringifyWebAppManifest(manifest);
```

Then link the manifest through `DocumentMetadata`:

```ts
AppShell({
    metadata: {
        manifest: "site.webmanifest"
    }
});
```

## Purpose

`DocumentMetadata` manages the document link to a manifest. `WebAppManifest` helps create the manifest content itself.

The low-level helper keeps common manifest fields typed while still allowing future or platform-specific fields through `extras`.

`createAppWebAppManifest()` is the app-level recipe. It keeps repeated public-app defaults in one place and expands common icon files into full manifest icon records.

Use `createAppIdentity()` plus `createAppIdentityWebAppManifest()` when the same app-owned identity also feeds document metadata, diagnostics, route setup, and app chrome. Use direct `createAppWebAppManifest()` calls when manifest data already comes from another application model.

## Defaults

`createAppWebAppManifest()` applies app-level defaults:

- `start_url` defaults to `"."`.
- `scope` defaults to `"."`.
- `display` defaults to `"standalone"`.
- `background_color` defaults to `themeColor` when no explicit `backgroundColor` is provided.
- `iconSet.svg` is emitted as an SVG icon with `sizes: "any"` and `purpose: "any"`.
- `iconSet.png192` and `iconSet.png512` are emitted as PNG icons with `purpose: "any maskable"`.

`createWebAppManifest()` applies small practical defaults:

- `start_url` defaults to `"."`.
- `display` defaults to `"standalone"`.

Other fields are only emitted when provided.

## Options

`createAppWebAppManifest()` accepts every `createWebAppManifest()` option except that `icons` is paired with a shortcut `iconSet` option:

- `iconSet.svg` - SVG icon source.
- `iconSet.png192` - 192x192 PNG icon source.
- `iconSet.png512` - 512x512 PNG icon source.
- `iconSet.svgPurpose` - purpose for the generated SVG icon. Defaults to `"any"`.
- `iconSet.pngPurpose` - purpose for the generated PNG icons. Defaults to `"any maskable"`.
- `icons` - additional manifest icons after the generated icon set. Use `null` to omit all generated and custom icons.

Shared manifest options:

- `name` - required full app name.
- `shortName` - shorter name for constrained UI.
- `description` - app description for install surfaces and app stores.
- `lang` - primary language.
- `dir` - text direction: `"ltr"`, `"rtl"`, or `"auto"`.
- `id` - stable app id.
- `startUrl` - launch URL. Defaults to `"."`.
- `scope` - navigation scope.
- `display` - preferred display mode.
- `displayOverride` - ordered display-mode fallback list.
- `orientation` - preferred orientation.
- `themeColor` - browser or OS UI theme color.
- `backgroundColor` - launch/splash background color.
- `categories` - app categories.
- `icons` - app icons.
- `shortcuts` - common app actions.
- `extras` - additional manifest fields not typed by the helper yet.

## Installable Icon Assets

Use SVG for scalable brand marks and favicons, but provide bitmap PNG icons for install surfaces.

Recommended baseline:

- `192x192` PNG for smaller install surfaces.
- `512x512` PNG for high-resolution install surfaces.
- at least one icon with `purpose: "any maskable"` when strict maskable diagnostics are enabled.

The source artwork should keep important content inside the safe center area, because platforms may crop maskable icons into different shapes.

## Diagnostics

Use `inspectWebAppManifest()` when a manifest is generated from application data and should be checked before publishing:

```ts
const manifest = createAppWebAppManifest({
    name: "Language App",
    shortName: "Language",
    description: "Accessible foreign-language learning app.",
    lang: "en",
    themeColor: "#111827",
    iconSet: {
        svg: "assets/logo.svg",
        png192: "assets/icon-192.png",
        png512: "assets/icon-512.png"
    }
});

const manifestReport = inspectWebAppManifest(manifest, {
    requireShortName: true,
    requireDescription: true,
    requireIcons: true,
    requireMaskableIcon: true,
    requireThemeColor: true,
    requireBackgroundColor: true
});

logWebAppManifestDiagnostics(manifestReport);
```

The report can also be passed into `AppDiagnostics` as a custom source:

```ts
logAppDiagnostics(createAppDiagnosticsReport({
    sources: [
        {
            id: "manifest",
            label: "Web App Manifest",
            report: manifestReport
        }
    ]
}));
```

Diagnostics check required identity, launch, color, icon, and shortcut fields without fetching external assets.

## Manual Checks

- `site.webmanifest` is valid JSON.
- Manifest diagnostics report no unexpected errors or warnings.
- The document links to it with `<link rel="manifest">`.
- `name` is meaningful as the installed app accessible name.
- `start_url` and `scope` work from the deployed base path.
- Icons resolve after deployment and include practical bitmap sizes for install surfaces.
- Maskable icons keep the meaningful logo content inside the safe center area.
- Theme and background colors match the app's initial visual design.
