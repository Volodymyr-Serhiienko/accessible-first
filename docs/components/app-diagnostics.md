# AppDiagnostics

AppDiagnostics combines several Accessible First diagnostics reports into one application health summary.

Use it when a real app or playground has independent checks such as page semantics, route metadata, localization, and public-web metadata, and developers need one compact status in the console.

## Quick Start

For app setup, prefer `createAppDiagnosticsRunner()`. It keeps diagnostics declarative and computes fresh reports every time the app asks for a health check.

```ts
const diagnostics = createAppDiagnosticsRunner({
    page: () => app.shell.inspect({
        log: false,
        documentMetadata: {
            requireDescription: true,
            requireCanonical: true
        }
    }),
    routes: inspectAppRoutes(routes, {
        requireDescription: true,
        requireDocumentTitle: true
    }),
    sources: () => [
        {
            id: "localization",
            label: "Localization",
            report: inspectLocaleController(locale, {
                requiredMessages: appRequiredMessageKeys
            })
        }
    ]
});

diagnostics.log();
```

Use `createAppDiagnosticsReport()` directly when you already have all reports and only need to combine them once.

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
- `createAppDiagnosticsRunner()` turns those checks into one reusable app-level health command.
- `createAppDiagnosticsReport()` combines already-created reports into one app-level status.

This keeps each inspector simple, while still giving an application a single health signal. Public app checks can combine page metadata, route metadata, web app manifest diagnostics, localization, and later custom SEO or interaction reports.

## Runner Options

- `page` - optional page diagnostics report or function returning one.
- `routes` - optional route diagnostics report or function returning one.
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

For public applications, keep app diagnostics enabled in development and CI-like preview environments. In production, log only when a developer flag is enabled.

## Manual Checks

- App diagnostics reports one combined status.
- Page diagnostics can be passed with `log: false` to avoid duplicate console output.
- Lazy runner sources update when locale, metadata, or route chrome changes.
- Localization diagnostics can be passed as a custom source to catch missing framework service text and app-owned messages.
- Public-page metadata checks, including social metadata and JSON-LD requirements, should usually live in the page diagnostics source.
- Route diagnostics remain visible as a source inside the app report.
- Custom sources do not break the aggregate report when they are `null` or `undefined`.
