# Agent Guide

Accessible First is a source-first TypeScript project for building accessible,
framework-independent web interfaces and public app templates.

Use this file when you are an AI coding agent working in this repository.

## Project Snapshot

- Main source: `packages/components/src` and `packages/core/src`.
- Public component entry: `packages/components/src/index.ts`.
- Styles entry: `packages/components/src/styles/index.css`.
- Playground app: `playground/`.
- Runnable starters:
  - `examples/minimal-static-public-site`
  - `examples/minimal-routed-public-app`
- Documentation:
  - `README.md`
  - `docs/architecture.md`
  - `docs/app-blueprint.md`
  - `docs/app-starter.md`
  - `docs/templates.md`
  - `docs/components/README.md`
  - `docs/ai-usage.md`

## Current Publication Status

The repository is not treated as a published npm package yet. Examples import
directly from `../../packages/components/src` or the equivalent relative path.

Do not suggest `npm install accessible-first` until package publishing is added
and documented.

## Development Commands

```bash
npm run build
npm run playground:dev
npm run playground:build
npm run example:static:dev
npm run example:static:build
npm run example:routed:dev
npm run example:routed:build
```

Prefer `npm run build` for type checking. The project uses strict TypeScript,
including `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.

## Architecture Rules

- Prefer native HTML semantics before custom roles.
- Keep behavior framework-independent.
- Reuse core utilities for focus, keyboard, ARIA, IDs, scrolling, overlays,
  selection, typeahead, and live regions.
- Keep labels, descriptions, hints, tooltips, announcements, validation
  messages, and toasts conceptually separate.
- Keep framework service text localizable. Do not hard-code new user-facing
  English service text inside reusable components.
- Put application copy in app locale files or page files, not in framework
  internals.
- Add JSDoc comments for every exported type, interface, function, and constant.
- Update relevant docs when adding or changing public APIs.
- Promote code from examples or the playground into the library only when it is
  repeated, product-independent, accessibility-related, or clearly useful as a
  reusable app shell/template foundation.

## Template Selection

Use `createPublicStaticAppTemplate()` for route-free public pages, landing
pages, small static sites, and documentation pages.

Use `createPublicAppTemplate({ mode: "hash" })` for SPA-like public apps that
need client-side route changes, route navigation, breadcrumbs, route search,
route command palette entries, route announcements, and route metadata
automation.

Use `createPublicAppTemplate({ mode: "link" })` or lower-level link routed
helpers when normal browser navigation, MPA behavior, or server-rendered pages
are the better product shape.

## Component Usage

Start from the component reference at `docs/components/README.md`.

Common composition components include `Button`, `Link`, `IconButton`, `Image`,
`TextField`, `Checkbox`, `RadioGroup`, `Select`, `Combobox`, `Switch`,
`Disclosure`, `Accordion`, `Dialog`, `AlertDialog`, `Popover`, `Tooltip`,
`ToastViewport`, `Navigation`, `ResponsiveNavigation`, `RouteChrome`,
`AppHeader`, `AppShell`, `Screen`, `Section`, `Stack`, `Grid`, `Table`,
`Pagination`, `Progress`, `ResultSummary`, `ListDetail`, `EmptyState`, and
`InfoCard`.

When a component needs visible or spoken help text, follow the shared
description/hint/announcement rules in `docs/hints-and-announcements.md`.

## Accessibility Checks

Before calling a change complete, think through:

- keyboard route on desktop;
- screen reader speech order;
- mobile screen reader route where touch exploration and swipe navigation differ
  from desktop Tab navigation;
- visible focus states;
- reduced duplicate speech;
- localization of service text;
- responsive layout without horizontal overflow;
- diagnostics output for pages, routes, localization, metadata, and manifest
  where applicable.

## Docs To Read First

For app-level work, read:

1. `docs/app-blueprint.md`
2. `docs/app-starter.md`
3. `docs/templates.md`
4. `docs/ai-usage.md`

For component work, read:

1. `docs/components/foundation.md`
2. the target component doc under `docs/components/`
3. `docs/hints-and-announcements.md`
4. `docs/localization.md`
