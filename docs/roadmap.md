# Roadmap

Accessible First is a source-first TypeScript foundation for accessible,
framework-independent browser applications. This is a working plan, not a change log.

## Current State

Study Languages and the AF Platform administration panel are published reference
applications. Their real workflows now drive improvements to shared components.
The routed/static starters and recorded-speech pilot remain small integration examples;
the playground demonstrates supported options and manual accessibility checks.

Available foundations:

- semantic composition, responsive app shell, navigation, screen and form layouts;
- localized controls, document language/direction and explicit foreign-language text;
- hash routing, validated detail patterns, metadata, diagnostics and public templates;
- focusable/sortable native tables, pagination, dialogs and account/password controls;
- coordinated toasts, hints and announcements, plus focus-preserving pending actions;
- scoped/versioned browser storage and cancellable task ownership;
- provider-neutral speech, recorded audio, bounded cache and optional Web Speech adapter.

Component and core references are the API source of truth:
[components](components/README.md), [core](core/README.md).
Application accounts, permissions, lesson schemas, server synchronization,
generation budgets and maintenance operations remain outside the framework.

## Current Audit

Review shared contracts against both reference applications, not just demo behavior.

The expanded audit remains open. Covered slices include:

- keyboard/IME, native state/reset, pending feedback, focus and ARIA ownership;
- managed/reentrant content, partial construction and exceptional terminal cleanup;
- collections, forms, overlays, navigation, search, language pickers and header tools;
- cancellable speech/tasks/lazy screens, playback subscriptions and BFCache restoration;
- real-CSS/native-keyboard fixtures for long text, narrow layouts, both themes and RTL.

Lifecycle checks cover stale/reentrant work, partial construction, exception-safe
cleanup and resource ownership across core helpers, components, routing and
templates. Metadata/diagnostics and robots/sitemap contracts have separate tests;
lazy playground screens retain explicit failure/reload behavior.

The shared style baseline has been checked across controls, fields, feedback,
containers, navigation, revealed content and overlays. Long copy, narrow embedded
areas, RTL glyphs, focus clearance, local scrolling and theme-switch geometry have
repeatable browser fixtures. This is not exhaustive support for arbitrary app CSS,
fixed-width content, every browser engine or physical viewport/keyboard behavior.

Exact counts, per-module coverage and outstanding application/backend operations
belong in the platform's single audit matrix. API guarantees and explicit limits
belong in owning guides, not a second audit diary here. Authorization, server
filters, import schemas, generation budgets and PWA cache policy remain app-owned.

The playground and three starters pass builds; 38 demo sections have been checked
for distinct content, console failures and desktop overflow. Both embedded AF
copies must match the main source/docs at release. The final application/backend
operational pass and manual compatibility acceptance remain; complete demo
translation and the dedicated language-markup review follow UI/content stability.

Tests do not prove real AT, physical-device behavior or unlimited browser support.
Finish desktop/mobile screen-reader and 200% zoom acceptance, including mixed-language
content. Shadow/slot traversal, discarded browser focus memory, transformed/visual
viewport geometry and required interactive toasts have documented limits.
Run focused checks after coherent changes; repeat the full release/dependency gate
when publication is ready.

## Next Sequence

1. Finish the shared reliability audit and verify application integration.
2. Keep starters/playground aligned with supported defaults and documented options.
3. Promote only repeated, product-independent behavior that removes real duplication.
4. Publish the framework first, then update consumer gitlinks and release applications.

After the reference UI/content stabilize, perform a dedicated language-markup
review across apps, playground and starters: document language, foreign values,
mixed text, control descriptions and announcements. Confirm actual screen-reader
voice switching; do not treat translated strings or DOM checks as sufficient.

Source-first imports and Git submodules remain the distribution contract.
Before npm publication, design package-local builds, export maps, style entry points,
dependencies and release checks together.

## Architectural Guardrails

- Prefer native HTML and existing composition before lower-level enhancement/core APIs.
- Supply localized service text; keep product copy and domain decisions in applications.
- Keep focus, ARIA state, pending feedback and cleanup coherent across controls.
- Treat HTML presence booleans differently from token-valued ARIA/SVG attributes.
- Keep routing catalogs finite; parameterized detail routes do not become sitemap entries.
- Browser DOM rendering is supported today. SSR/hydration requires an explicit future design.
- Real public URLs and prerender/SSR are needed before promising indexed lesson content.
- Do not add a generic CRUD layer, provider framework or rich editor without actual demand.

## Later Candidates

Evaluate these only when a real application needs them:

- accessible file validation/progress shared by multiple upload flows;
- drawer/sheet and guided multi-step workflows;
- native-first calendar/date controls;
- a complete toolbar keyboard model;
- virtualization after measuring large-list performance;
- charts with accessible data summaries and nonvisual alternatives.

Sorting, account controls, password reveal, loading/status feedback and recorded speech
already exist; extend their contracts instead of introducing parallel replacements.

## Release Gates

Check changed behavior for desktop keyboard navigation, visible focus, mobile touch,
localization, contrast/forced colors, reduced duplicate speech and teardown.
Use relevant unit/contract tests during development. Before publication run
`npm run check` and `npm audit --audit-level=high`, including playground and examples.

The long-term direction remains a small, readable code-first app foundation.
A visual site builder or full generator is not the current phase.
