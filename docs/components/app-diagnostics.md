# AppDiagnostics

AppDiagnostics combines multiple Accessible First diagnostics reports into one application health summary.

Use it when a real app or playground has several independent checks, such as page semantics and route metadata, and developers need one compact status in the console.

## Quick Start

```ts
const routeReport = inspectAppRoutes(routes, {
    requireDescription: true,
    requireDocumentTitle: true
});

const appReport = createAppDiagnosticsReport({
    page: shell.inspect({
        log: false,
        documentMetadata: {
            requireDescription: true,
            requireCanonical: true
        }
    }),
    routes: routeReport
});

logAppDiagnostics(appReport);
```

## Purpose

Accessible First diagnostics are intentionally layered:

- `page.inspect()` checks the rendered DOM, landmarks, headings, ids, ARIA references, controls, and component warnings.
- `inspectAppRoutes()` checks the route model, route hierarchy, hrefs, and route metadata.
- `createAppDiagnosticsReport()` combines those reports into one app-level status.

This keeps each inspector simple, while still giving an application a single health signal.

## Options

- `page` - optional `PageDiagnosticsReport`.
- `routes` - optional `AppRouteDiagnosticsReport`.
- `sources` - optional custom diagnostics reports.

A custom source needs an `id` and a report-like object with `status`, `issues`, and/or issue counts.

```ts
createAppDiagnosticsReport({
    sources: [
        {
            id: "metadata",
            label: "Metadata",
            report: metadataReport
        }
    ]
});
```

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

Use `logAppDiagnostics(report)` for a compact grouped console report:

```ts
logAppDiagnostics(appReport);
```

The logger prints one app-level summary and one line per source. The detailed source report is passed as console data so developers can inspect the original issues when needed.

## Accessibility

AppDiagnostics does not change UI behavior. It helps teams catch accessibility, semantics, route, and metadata problems while building.

For public applications, keep app diagnostics enabled in development and CI-like preview environments. In production, log only when a developer flag is enabled.

## Manual Checks

- App diagnostics reports one combined status.
- Page diagnostics can be passed with `log: false` to avoid duplicate console output.
- Route diagnostics remain visible as a source inside the app report.
- Custom sources do not break the aggregate report when they are `null` or `undefined`.

