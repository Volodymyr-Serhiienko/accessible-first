# Roadmap

Accessible First is moving from a component library into a lightweight, framework-independent foundation for building accessible SPA, MPA, and static public web applications.

This roadmap is a working plan, not a history log. Finished details belong in component docs, starter docs, or examples.

## Current Goal

Strengthen the framework's accessibility and public-runtime foundations while continuing toward the first real application: an accessible foreign-language learning app.

The stabilization pass is complete for the current source-first stage. Its
lasting decisions are now kept in the architecture, component, style, testing,
AI, and starter guides rather than in separate audit reports.

Current guardrails:

- the framework supports client-rendered browser DOM applications today; SSR
  and hydration require a future explicit design;
- normal applications start with a public template, then composition components;
  enhancement and core APIs are deliberate lower-level escape hatches;
- exact routes remain the default; typed parameterized hash routes are for
  data-driven detail screens and stay out of navigation/search catalogs unless
  an application supplies finite items deliberately;
- public patterns are promoted only after repeated, product-independent use;
- before npm publication, package-local builds, export maps, style entry
  points, package dependencies, and release verification must be designed and
  tested together.

The immediate foundation is now two runnable starters:

1. `examples/minimal-routed-public-app` for SPA-like public applications;
2. `examples/minimal-static-public-site` for public pages and simple static sites.

These starters prove the app shell, localization, metadata, diagnostics, theme, navigation, and content structure outside the playground.

## Stable Foundation

These layers are ready to build on, with normal refinements expected:

- platform utilities for DOM, events, IDs, focus, keyboard, ARIA, scroll, collection, and startup behavior;
- behavior modules for disclosure, dialog, tabs, listbox, menu, popover, overlay, typeahead, selection, live regions, validation announcements, and validation announcement strategy;
- composition primitives, semantic markup helpers, Page, AppShell, PageLayout, PageOutlet, Screen, sections, layout blocks, Icon, Image, and VisuallyHidden;
- accessible component baseline: buttons, links, icons, images, disclosures, dialogs, alerts, tabs, listboxes, menus, selects, comboboxes, popovers, tooltips, toasts, form fields, navigation, breadcrumbs, responsive navigation, header, screen, list/detail, tables, pagination, progress, result summaries, and status/empty/info patterns;
- app foundation: hash routing, native-link routing, route-free public static templates, public routed apps, public app templates, route chrome, route text, route registry, app identity, metadata, manifest, sitemap, robots, diagnostics, and locale refresh;
- localization foundation: framework service-text registry, app localization helper, locale formatter, required-key diagnostics, route text resolvers, document `lang` / `dir` sync, LanguageSelect, and reactive app refresh.
- client-state foundation: versioned records plus scoped browser storage for one
  application-owned storage namespace without a custom storage facade.
- optional browser speech foundation: a provider-neutral speech contract,
  Web Speech adapter, and localized composition controls without framework copy.

## Active Phase

### 1. First Reference App Discovery

Status: active.

The legacy Study Languages application is now available and has been inspected as a product prototype. The rewrite should use the Accessible First starter shape, but it should not mechanically migrate the old static DOM/global-state structure.

Current focus:

- preserve useful product scenarios from the old app: language pair setup, learning, repetition, grammar reading, speech rate, mixed-language speech, progress, admin editing, import/export;
- design the new app as a clean Accessible First application with a learner UI, an admin UI, and replaceable data providers;
- keep the first version frontend-first with seed data where possible, so backend hosting does not block product work;
- promote only proven, product-independent patterns back into the framework.

### 2. Stabilize Starter Examples

Status: maintenance cleanup.

The routed and static starters should stay small, readable, and runnable. They should prove real app wiring without becoming a second playground.

Current finish work:

- keep each starter README accurate;
- keep `docs/app-starter.md`, `docs/app-blueprint.md`, and `docs/templates.md` aligned;
- review local starter/playground CSS only when a repeated style clearly belongs in the library;
- avoid adding extra demo components unless they prove starter wiring.

### 3. Make The Repository AI-Friendly

Status: complete for the current source-first stage.

Current artifacts:

- `llms.txt` for compact model-facing repository discovery;
- `AGENTS.md` for coding-agent rules inside the repository;
- `docs/ai-usage.md` for template selection, source imports, component map, accessibility, localization, diagnostics, and command guidance;
- package metadata aligned with source-first status, repository URLs, MIT license, and searchable keywords.

Maintenance:

- keep AI guidance aligned as templates and public APIs change;
- revisit npm package publication metadata when the framework is ready to publish.

### 4. Prepare Framework Patterns From Real App Work

Status: active through the Study Languages rewrite.

Likely reusable patterns to validate in the app before moving into Accessible First:

- keep parameterized hash routing validated in real data-driven flows before
  extending it to native links, metadata, sitemap, or diagnostics;
- async resource loading with accessible loading, empty, retry, error, and
  cache-fallback states;
- data-provider contracts that can swap static seed data, local storage, HTTP APIs, and hosted databases;
- import/export and validation surfaces;
- admin data-management patterns with real keyboard and screen-reader ergonomics.

## Near-Term Sequence

1. Keep Study Languages screens lean by using `StatusMessage`, `ActionsBar`, and existing layout primitives instead of local mini-components.
2. Use the completed scoped-storage adapter for locale, preferences, and progress; keep record versions and migrations local to their schemas.
3. Use the completed browser speech API in Study Languages and verify it with
   real keyboard, touch, and screen-reader activation.
4. Validate parameterized lesson routes when Study Languages adds remote or
   editable content; extend the contract only from evidence.
5. Promote further application patterns only after real use proves their boundary.

## What Not To Do Yet

- Do not build a full generator before the starter examples are stable.
- Do not add every possible UI component before the first reference app shows the need.
- Do not move one-off application copy or domain behavior into the framework.
- Do not turn either minimal template or the first reference app into a second playground.
- Do not design the future visual site builder before the code-first workflow is proven.

## Component Expansion Queue

Build new components when they unlock real app work or repeated patterns.

High priority:

- DataTable behavior on top of native Table: sorting, selection, pagination, responsive alternatives;
- Drawer / SidePanel / Sheet for application panels and mobile layouts;
- Stepper / Wizard for guided workflows;
- FileUpload with accessible validation and progress;
- Avatar / UserMenu / ProfileAction for app headers;
- Loading, Skeleton, ErrorState, retry, and async screen patterns.

Research or later:

- Calendar / DatePicker with native-first fallback;
- Toolbar only after a real application needs a complete roving-focus keyboard model;
- virtualized large lists only after performance need is proven;
- rich text editing only after core app patterns are stable;
- charts only with accessible data summaries and non-visual alternatives.

## Cross-Cutting Gates

These areas must stay coherent as the framework grows:

- localization and pluralization;
- theme tokens, density, typography, and contrast;
- responsive shell, header, navigation, and header tools;
- SPA, MPA, and static-site routing/metadata alignment;
- form validation, validation summaries, action announcements, and quiet screen reader feedback;
- hint, description, tooltip, toast, and announcement rules;
- diagnostics and public-page health reports;
- assets, icons, images, manifests, and SEO metadata;
- desktop keyboard routes and mobile screen reader routes.

## Playground Role

The playground is living documentation and real-device validation. It should keep demo content, manual testing surfaces, and examples of component options.

Each audit pass must also review the relevant demo sections: recommended defaults, advanced supported options, keyboard and screen-reader behavior, mobile constraints, and localized service text should be demonstrable without turning the playground into a duplicate application.

Promote code from the playground into the library only when it is repeated, product-independent, accessibility-related, or clearly part of the reusable app shell/template foundation.

## First Reference App

The first reference app is the Study Languages rewrite. It should validate the framework against real workflows:

- lesson list and lesson detail;
- vocabulary list/detail;
- practice flow;
- settings and preferences;
- progress and result summaries;
- speech synthesis and mixed-language reading;
- import/export and content administration;
- replaceable data providers and future backend/auth boundaries;
- form validation;
- localized UI and formatted data;
- desktop keyboard use;
- mobile screen reader use.

## Long-Term Direction

Accessible First should become a small but serious web application framework: lighter than full virtual-DOM stacks, easier to start than large UI frameworks, and more opinionated about accessibility, localization, semantics, diagnostics, public metadata, and real user workflows.
