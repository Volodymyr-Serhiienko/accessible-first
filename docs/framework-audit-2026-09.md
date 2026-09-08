# Accessible First Framework Audit - September 2026

## Purpose And Scope

This document records a source-level architectural audit of Accessible First.
It covers the core and component packages, framework styles, playground,
runnable starters, developer and AI documentation, deployment workflow, and
the first integration experience in Study Languages.

It is a planning document, not a WCAG conformance claim. Passing TypeScript,
manual playground checks, diagnostics, or an automated accessibility scanner
cannot on their own prove WCAG conformance. A formal claim requires a defined
scope, representative user journeys, browser and assistive-technology testing,
and recorded results. The recommended evaluation structure follows
[WCAG-EM 2.0](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/).

## Evidence Collected

- The full source type check passes with `tsc --noEmit`.
- Local Markdown links within `docs/` resolve successfully.
- The repository has no tracked unit, DOM, end-to-end, visual-regression, or
  accessibility test files.
- The only GitHub workflow builds and deploys the playground. It does not run
  a separate type check, tests, accessibility checks, example builds, or
  documentation validation.
- The packages are intentionally source-first and private. Their manifest
  entry points already describe future package output, but the root TypeScript
  build emits to a different directory shape.
- The current Study Languages integration successfully exercises app identity,
  public app templates, localization, reactive refresh, route chrome,
  diagnostics, action announcements, status messages, and versioned storage.

## Audit Progress

Completed in this audit pass:

- Tooltip now meets the intended hover/focus interaction contract in the
  implementation: the pointer can move into its visual content, `Escape` works
  after hover without a click, and collision handling keeps the tooltip inside
  the viewport and above later page content.
- The incomplete `Toolbar` primitive was removed from the public API rather
  than retaining `role="toolbar"` without the required widget keyboard model.

Document-scoped announcement ownership is now implemented across normal
component feedback. Action and validation helpers, hover announcements,
tooltips, disclosure and popover open messages, PageOutlet fallback route
speech, ThemeToggle, Toast, and Combobox empty-result feedback share one
polite/assertive live-region pair per document. Dialog and AlertDialog are
intentionally focus-driven and do not create live-region messages. No test
infrastructure has been added yet, so this completed implementation still needs
the quality-gate coverage described below.

## What Is Already Strong

### Architecture And API Intent

The repository has a meaningful layered model: browser utilities and behavior
modules in `packages/core`, then composition and UI components, then app
runtimes, public templates, examples, and product applications. Component
source depends on core; core does not depend on components. This is a sound
direction.

The project has also made several unusually valuable decisions early:

- native HTML is preferred before custom ARIA roles;
- component lifecycle and `destroy()` are part of the public contract;
- descriptions, hints, tooltips, live announcements, validation feedback, and
  toasts are documented as different channels;
- framework-owned service text is localizable;
- route data can feed navigation, breadcrumbs, metadata, diagnostics, search,
  and command-palette entries;
- public identity, metadata, manifest, sitemap, robots, and diagnostics are
  not postponed until the end of an application;
- the app starters are runnable examples rather than aspirational snippets.

The newly introduced validation-announcement policy is especially important.
It gives forms a principled way to avoid speaking the same error through both a
live region and a moved focus target. Study Languages confirmed the adjacent
need for short, event-driven action announcements.

### Styling And Responsive Baseline

The default style layer has semantic tokens, logical CSS properties, 44px
target-size defaults across common controls, focus styles, dark-theme tokens,
and reduced-motion handling. The app shell uses dynamic viewport units with a
fallback and has already been exercised on small screens. This is a good
baseline for a DOM-first library.

### Documentation

The documentation is unusually broad for a source-first project. The main
architecture, component reference, starter guides, AI guide, localization,
announcements, templates, and roadmap are all present. `AGENTS.md` and
`llms.txt` give both human and AI contributors a practical starting point.

## Findings

Priorities describe framework risk, not the importance of any individual
feature.

| Priority | Finding | Why it matters | Recommended direction |
| --- | --- | --- | --- |
| P0 | There is no automated test suite or quality gate. | Focus, keyboard, live-region, routing, lifecycle, locale-refresh, and responsive regressions can return silently. The deployment workflow currently proves only that Vite built the playground. | Establish a small but real test pyramid and make it mandatory in CI before expanding the public API. |
| P0 before publishing | Package manifests are publication-shaped while the build is repository-shaped. `packages/*/package.json` points to `dist/index.*`, while the root compiler emits under root `dist/packages/*/src`. Packages are also coupled through relative `core/src` imports. | A future `npm publish` could ship broken entry points or the wrong source layout. | Keep source-first status explicit now. Design package-local builds, `exports`, style entry points, package dependencies, and release verification before any publication attempt. |
| P1 | Tooltip interaction contract is resolved in implementation, but unverified by automated browser tests. | Custom tooltip content triggered by hover is covered by WCAG 2.2 SC 1.4.13. It must be dismissible, hoverable, and persistent unless an exception applies. See [W3C guidance](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus). | Protect focus, Escape, trigger-to-tooltip hover transition, viewport edges, zoom, and touch fallback with browser tests before making an AA baseline claim. |
| P1 | The incomplete `Toolbar` primitive was removed from the public API. | An ARIA widget role must not promise a keyboard model the component does not implement. Native sequential Tab behavior remains correct for ActionsBar, Row, and Group. | Keep Toolbar out of the public API until a complete roving-focus widget contract and browser tests are justified by real application use. |
| P1 | Accessibility is designed thoughtfully but not verified as a product-level contract. | WCAG compliance cannot be inferred from ARIA attributes, manual notes, or diagnostics alone. Speech output also differs between NVDA, JAWS, VoiceOver, and TalkBack. | Set WCAG 2.2 AA as the initial target. Maintain an explicit browser/AT matrix and test representative flows with real users where possible. Do not market unverified conformance. |
| P1 | Document-scoped announcement ownership is implemented, but lacks automated and cross-screen-reader verification. | Shared ownership now prevents framework emitters from constructing competing live regions, while visible StatusMessage and dialogs retain their distinct semantic roles. Speech output still varies across AT/browser combinations. | Add contract and browser tests for priority, repeat messages, cleanup, focus-driven dialogs, Toast, validation, routes, and interaction between concurrent feedback sources. |
| P2 | `packages/components` contains composition, UI controls, page layout, routing, public templates, localization, metadata, PWA, and diagnostics in one public package. | It is convenient during source-first development but makes package ownership, tree-shaking, release versioning, and stable APIs harder as the project grows. | Do not split immediately. First publish an internal dependency map and define stable public families: core, DOM composition/UI, app runtime, public recipes, and styles. Use that map to guide a later package split or subpath export design. |
| P2 | The framework is renderer-independent in intent but browser-DOM-first in execution. Many composition paths eagerly require `document` or `window`; some others guard browser access. | The current wording can lead developers to expect server rendering or hydration support that does not yet exist. | State supported environments precisely: client-rendered browser DOM today. Treat SSR/hydration as a future architecture decision with a compatibility layer, not an implied feature. |
| P2 | Public API growth is faster than contract verification. The central component barrel exposes many families and rich `update()` APIs, while lifecycle, update idempotency, and destroy restoration have no automated regression suite. | Small changes to a shared primitive can affect a large number of components. | Add contract tests for every component family: create, update, keyboard path, ARIA relation, destroy, remount, and localized update. |
| P2 | Semantic status tokens, active-theme `color-scheme`, and a forced-colors fallback are implemented and their global-versus-opt-in policy is documented, but browser and real-device verification remain unautomated. | The CSS baseline is stronger, but contrast, zoom/reflow, text spacing, and forced-colors support are not yet a tested product contract. | Add browser and manual checks for forced colors, 200/400% zoom, text spacing, reduced motion, and narrow viewports. |
| P2 | `TrustedHtml()` makes raw markup insertion explicit, but it deliberately accepts a normal string and does not sanitize it. | Explicit naming prevents accidental use less often, but it cannot establish whether dynamic data is safe. | Keep it as the sole marked escape hatch, document the sanitizer boundary, and test that normal composition APIs remain text-safe. |
| P2 | Diagnostics are valuable developer feedback, not an accessibility or production-health proof. | They can inspect landmark, heading, metadata, localization, manifest, and route structure, but cannot determine focus behavior, color contrast, reading order, speech quality, network health, or security. | Keep diagnostics, clearly describe their scope, add machine-readable reporting, and let real apps register domain-specific reports. |
| P2 | The MPA/native-link API has documentation but no runnable starter comparable to the hash-routed starter. | The roadmap promises SPA, MPA, and static support; only static and hash SPA are demonstrated end-to-end. | Add a deliberately tiny native-link fixture or integration test before presenting MPA support as equally proven. It does not need to become a third large starter. |
| P3 | Documentation duplicates component lists and usage rules across README, AGENTS, llms, AI usage, roadmaps, and component pages. | This is currently helpful but will drift as APIs evolve. | Define one machine-readable public API/component manifest and generate or validate inventories and documentation links from it. Keep prose guides curated. |
| P3 | The playground is a strong manual laboratory but its 39 demo sections are not a regression suite. | It can demonstrate a behavior without detecting a later failure. Past responsive header, focus-clipping, route-focus, and mobile-scroll issues show the value of repeatable checks. | Keep the playground for exploration and real-device checks; extract stable scenarios into automated component, visual, and browser tests. |

## Accessibility Audit Strategy

Accessible First should adopt WCAG 2.2 AA as its engineering baseline. That is
a target, not a claim, until the framework and an application are evaluated.

### Automated Checks

Automated checks should cover repeatable structural failures:

1. core utility unit tests: IDs, ARIA references, focus, keyboard, collection,
   scroll, storage, locale matching, and announcement scheduling;
2. DOM component tests: native semantics, ARIA relationships, events,
   `update()`, `destroy()`, and remount behavior;
3. browser tests: keyboard routes, focus restoration, overlays, scroll and
   viewport positioning, route changes, locale refresh, and small-screen
   reflow;
4. accessibility scans in browser tests, with reviewed exceptions rather than
   ignored output;
5. visual regression checks for focus clipping, header/navigation breakpoints,
   dialogs, popovers, tooltips, and form feedback;
6. documentation/API checks: code snippets where practical, Markdown links,
   package entry points, and example builds.

### Manual Compatibility Matrix

Keep a versioned matrix for at least these representative flows:

- Windows + Chrome/Edge + NVDA;
- macOS + Safari + VoiceOver;
- Android + Chrome + TalkBack;
- iOS + Safari + VoiceOver;
- keyboard-only desktop at normal and 200% zoom;
- touch, landscape, text enlargement, reduced motion, and forced-colors or
  high-contrast modes where the platform provides them.

Test by journey, not only by component: route change, form error, success
feedback, disclosure/overlay, mobile navigation, settings changes, and a
long-content page. Record known support limits instead of hiding them.

## Architecture Direction

The next architectural step should be clarification, not a large rewrite.

```text
core behavior
  -> DOM composition and visual components
    -> app runtime and routing
      -> public templates/recipes
        -> applications, examples, playground
```

For now these may remain in the current source tree. The important additions
are explicit boundaries, contract tests, and package plans. A physical package
split should happen only when the boundaries have been exercised by the
reference app and the publishing strategy is ready.

The following rules should guide future API decisions:

- keep components DOM-first and renderer-independent, but do not promise SSR;
- put product text, learning logic, speech rules, and data contracts in apps;
- promote code to the library only after it repeats across real scenarios or
  establishes a cross-cutting accessibility policy;
- prefer small primitives plus app recipes over one universal configuration
  object;
- provide explicit ownership for document-level resources: live regions,
  overlays, scroll locks, metadata, and page chrome;
- make every public component testable without the playground;
- preserve native escape hatches, but label security-sensitive escape hatches
  unmistakably.

## Lessons From Study Languages

Study Languages has already produced useful evidence without justifying a rush
of new generic components.

Validated framework value:

- a public app template starts a real application quickly;
- localized framework text and app text can live together cleanly;
- reactive locale refresh is practical but needs recursion/lifecycle tests;
- `StatusMessage` plus an explicit action announcer can keep visible feedback
  and spoken feedback separate;
- versioned storage is a reusable core need;
- responsive route chrome, header tools, focus restoration, and mobile
  screen-reader flows deserve browser-level regression coverage.

Not yet proven enough to enter the framework:

- language-learning content models and lesson sequencing;
- speech synthesis control and mixed-language reading;
- data-provider contracts;
- progress logic;
- admin editing, import/export, authentication, and paid-feature policy.

The application should next grow a read-only lesson flow using seed data. That
will reveal whether async-state, data-provider, list/detail, speech, progress,
or navigation patterns are truly generic. Library work should be promoted from
that evidence rather than anticipated in advance.

## Public API Review

The public API should optimize for a small number of obvious starting points,
not for exposing every internal assembly step from the root barrel. The review
uses four questions for every export:

1. Does it solve a distinct developer problem?
2. Is there one clearly documented primary way to use it?
3. Does its default preserve native semantics, localized service text, and
   lifecycle cleanup?
4. Is it a stable public contract, an advanced escape hatch, or internal
   assembly code?

### Current Decisions And Candidates

| Family | Evidence | Direction |
| --- | --- | --- |
| Live feedback | `createLiveRegion()`, isolated `createAnnouncer()`, and document-coordinated delivery solve distinct levels of control. | Keep all three, but document `createActionAnnouncer()` as the normal application entry point and document-level channels as advanced infrastructure. |
| IconButton hints | The API now has one canonical hint model: `hint`, `hintDisplay`, and `hintAnnounceOnHover`. Unused `tooltip`, `announceOnHover`, and `setTooltip()` aliases were removed. | Keep native `title` as a deliberate HTML attribute, separate from Accessible First hint behavior. |
| Icon labels | `IconLabel()` is a small composition primitive for visible icon-and-caption controls and navigation. It adds no interactive ARIA role or focus behavior. | Demonstrate it in the Navigation playground section after the current API pass; do not turn site navigation into an ARIA `Menu`. |
| App localization | `createAppLocalization()` now exposes the locale controller directly with `format` and `requiredMessageKeys`; the redundant `.locale` self-alias was removed. | Keep the small bundle focused. Add new properties only when they provide behavior unavailable on the controller itself. |
| Public templates and route chrome | Hash, link, static, route chrome, and lower-level routing APIs are each useful at different levels, but the root barrel presents them with equal weight. | Do not remove working advanced APIs. Mark normal entry points, advanced recipes, and internal helpers in documentation now; design subpath exports before package publication. |
| Trusted HTML | `TrustedHtml()` is the explicit escape hatch for already trusted or sanitized markup. | Keep one strongly named API; never imply that it sanitizes dynamic content. |

No API should be removed merely because it is low-level. Removal is appropriate
when two public paths solve the same job, one has clearer semantics, and project
usage confirms that the duplicate is not required. Each contraction needs a
migration note while the framework remains pre-1.0.
## Refactoring Plan

### Work Package 0 - Audit Baseline

Create a short support policy before altering implementations:

- supported browser baseline;
- WCAG 2.2 AA engineering target and non-claim wording;
- manual assistive-technology matrix;
- definition of source-first versus publishable package status;
- ownership map for core, components, app runtime, templates, playground, and
  examples.

Done when the policy is documented and linked from the roadmap and AI guide.

### Work Package 1 - Quality Gate

Add the smallest durable test infrastructure and CI workflow:

- `typecheck` separate from emission;
- core and component DOM tests;
- browser smoke tests for the playground and both starters;
- accessibility scans and visual regression fixtures for high-risk controls;
- build checks for playground and both starters;
- Markdown/API/package validation.

Start with high-risk primitives, not an attempt to test every option at once:
focus, live regions, disclosure/dialog/popover/tooltip, form validation,
responsive navigation, routing, localization refresh, and destroy behavior.

Done when pull requests and Pages deployment cannot bypass the quality gate.

### Work Package 2 - Verify The Current Accessibility Contracts

Implementation now covers Tooltip hover/focus behavior, removal of the incomplete
Toolbar role, and document-scoped announcement ownership. The remaining work is
to verify those decisions rather than redesign them:

1. add SC 1.4.13 browser tests for Tooltip hover, focus, Escape, viewport edges,
   zoom, and touch fallback;
2. retain native sequential focus for ActionsBar, Row, and Group, and add a
   complete Toolbar only when a roving-focus product case proves the need;
3. add contract and browser tests for coordinated validation, route, status,
   toast, and repeated-message announcements;
4. add browser tests for focus not obscured by sticky chrome, mobile menu close
   behavior, and focus restoration.

Done when these flows are tested on the selected desktop and mobile matrix.

### Work Package 3 - Stable Public Surface

- catalogue all exports by layer and stability;
- identify provisional APIs, especially rich recipe and `update()` APIs;
- add contract tests before changing public behavior;
- document the client-only runtime boundary;
- decide whether `Toolbar` remains a layout primitive or becomes an interaction
  component;
- define a migration policy while the project remains pre-1.0.

Done when a contributor can tell which API to use, which layer owns it, and how
breaking change risk is managed.

### Work Package 4 - Style System And Responsive Confidence

- document the global CSS contract and override strategy;
- preserve the completed semantic theme/status tokens and verify them in browsers;
- verify dark mode, forced colors, contrast, zoom/reflow, text spacing, and
  reduced motion;
- convert known header/navigation/popover/focus cases into visual browser
  fixtures;
- establish responsive breakpoints from behavior rather than device names.

Done when the styles are predictable inside a real application without local
CSS workarounds for framework defaults.

### Work Package 5 - Templates, Documentation, And Publication Readiness

- keep the two starters minimal and test them as independent applications;
- add a small native-link/MPA proof fixture;
- add an API/component manifest to reduce duplicated inventories;
- validate examples and key code snippets;
- design package-local build output, `exports`, CSS distribution, and release
  checks, but do not publish until they are tested.

Done when a new app can choose a template confidently and a future package
release has an explicit, tested path.

### Work Package 6 - Resume Reference-App Discovery

Continue Study Languages with seed-backed lesson list and lesson detail.
Maintain an integration log: problem, app-local solution, candidate framework
pattern, evidence from at least one more scenario, and promotion decision.

Done when the learner flow has enough real complexity to validate the next
framework additions without speculative component growth.

## Recommended Order

Do not begin a broad component expansion or a package split now. The smallest
high-value sequence is:

1. agree the support and WCAG target policy;
2. establish the quality gate;
3. test Tooltip, coordinated announcements, and native sequential action layouts;
4. turn known responsive chrome scenarios into browser fixtures;
5. complete the public-surface and style-contract audit;
6. continue the Study Languages read-only learner flow;
7. promote only patterns that survive the reference app;
8. prepare package publication only after the tested public surface is stable.

This sequence protects the existing investment, gives the framework an honest
accessibility baseline, and still moves it steadily toward useful real
applications.
