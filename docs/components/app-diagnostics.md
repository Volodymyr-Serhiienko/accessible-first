# AppDiagnostics

AppDiagnostics combines several Accessible First diagnostics reports into one application health summary.

Use it when a real app or playground has independent checks such as page semantics, route metadata, localization, and public-web metadata, and developers need one compact status in the console.

## Quick Start

For full public app entry points, prefer [PublicHashRoutedApp](./public-hash-routed-app.md) for hash SPAs or [PublicLinkRoutedApp](./public-link-routed-app.md) for native-link/MPA pages. Use `createPublicAppDiagnosticsRunner()` when an app has custom runtime wiring but still wants strict page metadata, localization, manifest, route, and custom diagnostics.

```ts
const diagnostics = createPublicAppDiagnosticsRunner({
    page: () => app.shell,
    identity: appIdentity,
    identityManifestOptions: {
        lang: "en",
        dir: "ltr",
        id: "."
    },
    routes,
    routeOptions: {
        baseUrl: "https://example.com/app/"
    },
    locale,
});

diagnostics.log();
```

Use `createAppDiagnosticsRunner()` when the app is private or needs fully custom source wiring. Use `createAppDiagnosticsReport()` directly when you already have all reports and only need to combine them once.

```ts
const report = createAppDiagnosticsReport({
    page: pageReport,
    routes: routeReport,
    sources: [
        {
            id: "manifest",
            label: "Web App Manifest",
            report: manifestReport
        }
    ]
});

logAppDiagnostics(report);
```

## Purpose

Accessible First diagnostics are intentionally layered:

- `page.inspect()` checks the rendered DOM, landmarks, headings, ids, ARIA references, controls, component warnings, and document metadata.
- `inspectAppRoutes()` checks the route model, route hierarchy, hrefs, and route metadata.
- `inspectLocaleController()` checks supported locale dictionaries and required message keys.
- Manifest, robots, sitemap, or app-specific reports can be added as custom sources.
- `createPublicAppDiagnosticsRunner()` applies strict public-app defaults for document metadata and manifest checks, then adds route, locale, and custom sources. Public routed app recipes use it internally.
- `createAppDiagnosticsRunner()` turns custom checks into one reusable app-level health command.
- `createAppDiagnosticsReport()` combines already-created reports into one app-level status.

This keeps each inspector simple, while still giving an application a single health signal. Public app checks can combine page metadata, route metadata, web app manifest diagnostics, localization, and later custom SEO or interaction reports. `PublicHashRoutedApp` and `PublicLinkRoutedApp` wire those checks with app shell and route-list defaults.

## Public App Runner

`createPublicAppDiagnosticsRunner()` is a small recipe over `createAppDiagnosticsRunner()`. It can inspect a `Page`, `AppShell`, existing page diagnostics report, route list, or existing route diagnostics report, then adds localization and web app manifest sources when provided. If `identity` is provided and `manifest` is omitted, it generates the manifest diagnostics source from `AppIdentity`. If `identity` is provided with route lists, route diagnostics use identity-aware route metadata defaults for generated document titles, canonical URLs, and WebPage JSON-LD unless the app overrides them.

Defaults:

- page document metadata requires description, canonical, robots, manifest, Open Graph, Twitter/X, and JSON-LD;
- page diagnostics use `log: false` so the app report is not duplicated by a separate page report;
- route lists use public route diagnostics defaults for descriptions, document titles, canonical URLs, and structured data; with `identity`, route options are expanded through `createAppIdentityRouteDiagnosticsOptions()`;
- identity can generate the manifest diagnostics source when no explicit manifest is provided;
- manifest diagnostics require short name, description, start URL, display mode, icons, maskable icon, theme color, and background color.

Options:

- `page` - optional `Page`, `AppShell`, page diagnostics report, or lazy resolver.
- `pageOptions` - overrides merged on top of public page diagnostics defaults.
- `identity` - optional `AppIdentity` used to derive manifest diagnostics when `manifest` is not provided.
- `identityManifestOptions` - manifest overrides used when diagnostics generate a manifest from identity.
- `routes` - optional route list, route diagnostics report, or resolver.
- `routeOptions` - route diagnostics and identity-aware route metadata defaults used when `routes` is a route list. Public routed app recipes can default this from top-level `routeMetadata`.
- `locale` - optional locale controller or resolver.
- `localeOptions` - localization diagnostics options, such as required message keys. Public diagnostics infer `requiredMessageKeys` automatically when `locale` is a `createAppLocalization()` result, so pass this only for manual controllers or explicit overrides.
- `manifest` - optional web app manifest object or resolver. Pass `false` to skip manifest diagnostics even when `identity` is provided.
- `manifestOptions` - overrides merged on top of public manifest diagnostics defaults.
- `sources` - optional custom diagnostics sources or resolver.
- `log` - optional logging behavior.

Use `createPublicAppPageDiagnosticsOptions()` and `createPublicAppManifestDiagnosticsOptions()` when an app wants the same strict defaults without the full runner.


## Public Routed App Defaults

`createPublicRoutedAppDiagnostics(target, options)` is the shared helper used by public routed app recipes. It defaults `page` to the created app shell and `routes` to the app route list, then forwards identity, manifest, locale, route options, and custom sources to `createPublicAppDiagnosticsRunner()`.

Use it directly only when building a new app runtime recipe. Application entry files should usually use `PublicHashRoutedApp` or `PublicLinkRoutedApp` instead.
## Runner Options

- `page` - optional page diagnostics report or function returning one.
- `routes` - optional route diagnostics report or function returning one. Public runners may also accept route lists through `routes` plus `routeOptions`.
- `sources` - optional custom diagnostics sources or function returning sources.
- `log` - optional logging behavior. Pass `false` to disable default console logging, or pass a custom function.

Lazy options are useful when the app shell, locale, metadata, or rendered route can change after startup.

```ts
const diagnostics = createAppDiagnosticsRunner({
    page: () => shell.inspect({ log: false }),
    sources: () => getCustomDiagnosticsSources()
});

const report = diagnostics.inspect();
```

## Report Options

- `page` - optional `PageDiagnosticsReport`.
- `routes` - optional `AppRouteDiagnosticsReport`.
- `sources` - optional custom diagnostics reports.

A custom source needs an `id` and a report-like object with `status`, `issues`, and/or issue counts.

## Report

The returned report contains:

- `status` - `healthy`, `needs-attention`, or `blocked`.
- `sources` - normalized per-source reports.
- `errorCount` - total errors.
- `warningCount` - total warnings.
- `infoCount` - total info findings.
- `issueCount` - total issues.

A report is `blocked` when any source has errors, `needs-attention` when there are warnings but no errors, and `healthy` when there are no errors or warnings.

## Console Output

Use `diagnostics.log()` or `logAppDiagnostics(report)` for a compact grouped console report. The logger prints one app-level summary and one line per source. The detailed source report is passed as console data so developers can inspect original issues when needed.

## Accessibility

AppDiagnostics does not change UI behavior. It helps teams catch accessibility, semantics, route, localization, and metadata problems while building.

Diagnostics output is developer-facing console text. It should not be treated as user-facing application copy and does not need to participate in the first user-interface localization layer.

For public applications, keep app diagnostics enabled in development and CI-like preview environments. In production, create the runner when useful for explicit health checks, but log only when a developer flag is enabled.

## Manual Checks

- App diagnostics reports one combined status.
- Page diagnostics can be passed with `log: false` to avoid duplicate console output.
- Lazy runner sources update when locale, metadata, or route chrome changes.
- Localization diagnostics can be passed as a custom source to catch missing framework service text and app-owned messages.
- Public-page metadata checks, including social metadata and JSON-LD requirements, should usually use `createPublicAppDiagnosticsRunner()` or `createPublicAppPageDiagnosticsOptions()`.
- Route diagnostics remain visible as a source inside the app report.
- Custom sources do not break the aggregate report when they are `null` or `undefined`.
