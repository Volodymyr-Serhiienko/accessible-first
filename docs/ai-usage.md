# AI Usage Guide

This guide helps AI coding agents and human developers understand how to use
Accessible First without scanning the whole repository.

Accessible First is currently a source-first TypeScript framework. It is not
published as an npm package yet, so examples import from local source paths.

## What Accessible First Is For

Use Accessible First when the task needs:

- semantic web UI without a virtual-DOM framework dependency;
- accessible controls with keyboard and screen reader behavior;
- page and app shells with consistent landmarks and focus movement;
- responsive public app templates;
- localization from the beginning;
- document metadata, manifest, route metadata, sitemap, robots, and diagnostics;
- reusable app foundations for SPA, MPA, and static public sites.

## First Choice: Template

Choose the app shape before choosing individual components.

Use `examples/minimal-static-public-site` when the product is a public page,
landing page, documentation page, small information site, portfolio, or other
route-free site.

Use `examples/minimal-routed-public-app` when the product needs client-side
route changes, active navigation, breadcrumbs, route search, command palette
entries, route announcements, or route metadata automation.

Use native-link or MPA helpers when separate documents, server rendering, or
normal browser navigation are the right shape.

## Source Imports

Until publishing exists, examples use source imports:

```ts
import "../../packages/components/src/styles/index.css";
import {
    Button,
    createPublicStaticAppTemplate
} from "../../packages/components/src";
```

App-specific CSS should be imported after framework CSS:

```ts
import "../../packages/components/src/styles/index.css";
import "./styles.css";
```

## Static Site Starter Pattern

```ts
createPublicStaticAppTemplate({
    mount: "#app",
    identity: getAppIdentity,
    locale: appLocalization,
    shell: getShellOptions,
    content: HomePage,
    diagnostics: {
        pageOptions: {
            landmarks: {
                requireNavigation: false
            }
        },
        log: true
    }
});
```

Use resolver functions for localized identity, shell, content, and metadata so
language changes can refresh app-owned UI.

## Routed App Starter Pattern

```ts
createPublicAppTemplate({
    mode: "hash",
    routes,
    mount: "#app",
    identity: getAppIdentity,
    locale: appLocalization,
    routeText,
    routeMetadata: getRouteMetadataOptions(),
    shell: getShellOptions,
    routeChrome: getChromeOptions,
    diagnostics: getDiagnosticsOptions()
});
```

Routes should keep readable fallback text and point to localized keys. The same
route list should feed navigation, breadcrumbs, search, commands, metadata, and
diagnostics.

## Component Map

Start from [Component Reference](./components/README.md). Important families:

- Basic controls: Button, Link, IconButton, Checkbox, RadioGroup, TextField,
  Select, Combobox, Switch.
- Disclosure and overlays: Disclosure, Accordion, Dialog, AlertDialog, Popover,
  Tooltip, ToastViewport, Menu, Listbox, Tabs.
- Layout and content: Screen, Section, Stack, Row, Grid, Container, HeaderBar,
  ActionsBar, EmptyState, InfoCard, Badge, Image, Icon, DescriptionList.
- Data and flows: Table, Pagination, Progress, ResultSummary, ListDetail,
  SettingsGroup, Form, FieldGroup, FormSection.
- App foundation: Page, AppShell, PageLayout, PageOutlet, AppHeader,
  HeaderTools, Navigation, ResponsiveNavigation, RouteChrome, RouteSearchBox,
  RouteCommandPalette, RouteBreadcrumbs, HashRouter, HashRoutedApp,
  LinkRoutedApp, PublicAppTemplate, PublicStaticAppTemplate.
- Public metadata and diagnostics: AppIdentity, DocumentMetadata,
  WebAppManifest, RobotsTxt, AppRouteSitemap, AppDiagnostics.

## Accessibility Rules

Prefer native semantics. Use custom roles only when native HTML cannot express
the control.

Keep these concepts separate:

- label: the control or region name;
- description: stable supporting text connected to the focused whole component
  or field when needed;
- hint: optional guidance for use;
- tooltip: visible or spoken short help for hover/focus patterns;
- announcement: event-driven speech after changes;
- toast: temporary status feedback, not a replacement for important dialogs.

Avoid noisy duplicate speech. A section description should be announced when
the section itself receives focus, not every time a child field receives focus.

Test desktop keyboard routes and mobile screen reader routes separately. Mobile
screen reader users may navigate by touch exploration and swipe order, not only
by desktop Tab order.

## Localization Rules

Use `createAppLocalization()` for app text and framework service text.

Keep app message keys in `src/localization/types.ts`, one locale file per
language under `src/localization/locales/`, and a shared controller in
`src/localization/index.ts`.

Translate framework service keys in non-English apps when the component uses
framework-owned text. Do not add hard-coded English service strings to reusable
components.

Use browser/system language, saved preference, and explicit user choice as the
language signal. Do not use geographic location as the default language signal.

## Metadata And Diagnostics

Public apps should have one `AppIdentity` used by:

- brand/header;
- document metadata;
- web app manifest;
- icons and preview image;
- diagnostics;
- route metadata when routes exist.

Enable diagnostics in development. Configure intentional omissions explicitly,
for example `requireNavigation: false` for a route-free static page.

## Commands

```bash
npm run build
npm run playground:dev
npm run playground:build
npm run example:static:dev
npm run example:static:build
npm run example:routed:dev
npm run example:routed:build
```

## Do Not

- Do not suggest npm installation until publishing is documented.
- Do not add React, Vue, Svelte, or other renderers unless the task explicitly
  asks for an integration layer.
- Do not bypass existing Accessible First components with one-off controls.
- Do not move product-specific copy, routes, or domain behavior into the
  framework.
- Do not add component exports without JSDoc comments.
- Do not rely on color alone for state.
- Do not create hover-only functionality without keyboard and touch alternatives.
