# Roadmap

Accessible First is moving from a component library into a lightweight, framework-independent foundation for building accessible SPA, MPA, and static public web applications.

This roadmap is a working plan, not a history log. Finished details belong in component docs, starter docs, or examples.

## Current Goal

Prepare the framework for the first real application: an accessible foreign-language learning app.

Before that migration starts, the framework should have two small runnable starters:

1. a routed public app template for SPA-like applications;
2. a static public site template for simple pages and small sites.

Those starters should prove the app shell, localization, metadata, diagnostics, theme, navigation, and content structure outside the playground.

## Stable Foundation

These layers are ready to build on, with normal refinements expected:

- platform utilities for DOM, events, IDs, focus, keyboard, ARIA, scroll, collection, and startup behavior;
- behavior modules for disclosure, dialog, tabs, listbox, menu, popover, overlay, typeahead, selection, live regions, and validation announcements;
- composition primitives, semantic markup helpers, Page, AppShell, PageLayout, PageOutlet, Screen, sections, layout blocks, Icon, Image, and VisuallyHidden;
- accessible component baseline: buttons, links, icons, images, disclosures, dialogs, alerts, tabs, listboxes, menus, selects, comboboxes, popovers, tooltips, toasts, form fields, navigation, breadcrumbs, responsive navigation, header, screen, list/detail, tables, pagination, progress, result summaries, and status/empty/info patterns;
- app foundation: hash routing, native-link routing, public routed apps, public app templates, route chrome, route text, route registry, app identity, metadata, manifest, sitemap, robots, diagnostics, and locale refresh;
- localization foundation: framework service-text registry, app localization helper, locale formatter, required-key diagnostics, route text resolvers, document `lang` / `dir` sync, LanguageSelect, and reactive app refresh.

## Active Phase

### 1. Stabilize The Routed Template

Status: almost done.

`examples/minimal-routed-public-app` should remain the canonical first runnable app starter. It includes brand, header tools, theme, localization, two routes, route navigation, breadcrumbs, footer, metadata, manifest assets, diagnostics, and page content files.

Current finish work:

- keep its README accurate;
- keep `docs/app-starter.md`, `docs/app-blueprint.md`, and `docs/templates.md` aligned;
- avoid adding extra demo components to this template unless they prove starter wiring.

### 2. Create The Static Public Site Template

Status: next.

Create `examples/minimal-static-public-site` as a simpler starter for pages and small sites that do not need SPA route changes. It should prove identity, metadata, theme, localization shape, semantic content, footer, diagnostics, and local style overrides with less routing machinery.

### 3. Make The Repository AI-Friendly

Status: next after the two templates.

Add concise machine-readable and agent-readable guidance so AI coding agents can understand how to use the framework without scraping the whole repo.

Likely artifacts:

- a short framework overview;
- template selection guidance;
- component usage rules;
- accessibility and localization rules;
- common commands;
- examples map;
- contribution and extension notes.

### 4. Prepare The First Reference App

Status: after starters and AI-friendly docs.

Bring in the legacy foreign-language learning app only after the starter shape is stable enough to guide the migration. Then migrate screen by screen and promote only repeated, product-independent patterns back into the framework.

## Near-Term Sequence

1. Finish documentation cleanup for the routed template.
2. Create `minimal-static-public-site`.
3. Review local playground CSS for styles that should now live in the library, but only in focused passes.
4. Add AI-friendly repository guidance.
5. Ask for the legacy language-learning app code.
6. Build the first reference app using the starter shape.
7. Promote proven application patterns into the framework.

## What Not To Do Yet

- Do not build a full generator before the two starter examples are stable.
- Do not add every possible UI component before the first reference app shows the need.
- Do not move one-off application copy or domain behavior into the framework.
- Do not turn the minimal routed template into a second playground.
- Do not design the future visual site builder before the code-first workflow is proven.

## Component Expansion Queue

Build new components when they unlock real app work or repeated patterns.

High priority:

- DataTable behavior on top of native Table: sorting, selection, pagination, responsive alternatives;
- Drawer / SidePanel / Sheet for application panels and mobile layouts;
- Toolbar and grouped action improvements;
- Stepper / Wizard for guided workflows;
- FileUpload with accessible validation and progress;
- Avatar / UserMenu / ProfileAction for app headers;
- Loading, Skeleton, ErrorState, retry, and async screen patterns.

Research or later:

- Calendar / DatePicker with native-first fallback;
- virtualized large lists only after performance need is proven;
- rich text editing only after core app patterns are stable;
- charts only with accessible data summaries and non-visual alternatives.

## Cross-Cutting Gates

These areas must stay coherent as the framework grows:

- localization and pluralization;
- theme tokens, density, typography, and contrast;
- responsive shell, header, navigation, and header tools;
- SPA, MPA, and static-site routing/metadata alignment;
- form validation, validation summaries, and quiet screen reader feedback;
- hint, description, tooltip, toast, and announcement rules;
- diagnostics and public-page health reports;
- assets, icons, images, manifests, and SEO metadata;
- desktop keyboard routes and mobile screen reader routes.

## Playground Role

The playground is living documentation and real-device validation. It should keep demo content, manual testing surfaces, and examples of component options.

Promote code from the playground into the library only when it is repeated, product-independent, accessibility-related, or clearly part of the reusable app shell/template foundation.

## First Reference App

The first reference app will be an accessible foreign-language learning application. It should validate the framework against real workflows:

- lesson list and lesson detail;
- vocabulary list/detail;
- practice flow;
- settings and preferences;
- progress and result summaries;
- form validation;
- localized UI and formatted data;
- desktop keyboard use;
- mobile screen reader use.

## Long-Term Direction

Accessible First should become a small but serious web application framework: lighter than full virtual-DOM stacks, easier to start than large UI frameworks, and more opinionated about accessibility, localization, semantics, diagnostics, public metadata, and real user workflows.
