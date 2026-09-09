# Public API Audit - September 2026

## Purpose

This audit makes Accessible First easier to discover, compose, and evolve before
more application work expands its public surface. It reviews every export
reachable through `packages/core/src/index.ts` or `packages/components/src/index.ts`.
It does not treat a low-level primitive as a defect merely because it is
advanced.

The audit records only evidence-backed decisions:

- **keep**: the export solves a distinct developer problem with a clear owner;
- **clarify**: keep the API, but improve its default, documentation, tests, or
  public-family placement;
- **change**: merge, rename, deprecate, or remove only when duplicate behavior
  and existing consumer usage show that a clearer path is safe.

No production source changes are part of this audit until a finding has a
specific recommendation and migration impact.

## Review Criteria

Every public family is checked for:

1. one obvious primary entry point and a justified advanced escape hatch;
2. native semantics and accessible defaults without application-specific text;
3. explicit ownership and cleanup of focus, document state, live regions,
   overlays, metadata, subscriptions, and event listeners;
4. useful defaults with optional configuration rather than required boilerplate;
5. localization, description, validation, and announcement behavior where the
   component presents user-facing feedback;
6. compatibility with composition primitives, app recipes, and static/SPA/MPA
   usage without hidden coupling;
7. JSDoc, component documentation, AI guidance, and a testable contract for
   behavior that is shared or historically fragile.

## Audit Order

| Wave | Families | Status |
| --- | --- | --- |
| 1 | Core DOM, ARIA, focus, events, scroll, collection, selection, live-region, validation, overlays, keyboard models | Reviewed; API hygiene batch complete |
| 2 | Composition, semantic markup, layout, images/icons, page primitives, feedback and informational components | Reviewed; follow-up pending |
| 3 | Form, checks, selection controls, disclosure, navigation, menu, tabs, search, combobox, tooltip, toast, dialogs | Reviewed; targeted contracts complete |
| 4 | Localization, theme, metadata, diagnostics, routing, app shell/chrome, public templates and PWA helpers | Reviewed; packaging guidance pending |
| 5 | Root barrels and documentation reviewed; playground/CSS pass in progress |

## Environment Verification

The maintainer runtime was upgraded and verified on 8 September 2026:

- Node.js `v24.20.0`;
- npm `11.19.0`;
- `npm ci`, `npm run typecheck`, the forty-nine-test Vitest contract suite, and
  all three Vite production builds completed successfully.

The repository intentionally pins the Node major in `.nvmrc` and
`package.json#engines`. A future Node 24 patch update should only require the
same clean install and `npm run check`; a future major upgrade is a separate
toolchain decision.

## Preliminary Findings

### Confirmed Direction

- The `createX()` and `X()` pairs are intentional rather than duplicates:
  `createX()` attaches a behavior/controller to existing DOM, while `X()`
  creates a declarative composition surface. This distinction is useful for
  Accessible First's DOM-first and progressively adoptable model.
- `createPublicAppTemplate()` is the normal application entry point;
  mode-specific public templates, routed-app helpers, and route-chrome
  renderers are legitimate advanced layers. They should be documented as a
  ladder, not removed simply because starters use the top layer.
- Granular ARIA, keyboard, DOM, collection, and focus helpers remain useful
  core primitives. Combining them into one catch-all helper would make intent
  less clear and would not reduce meaningful public complexity.

### Finding Log And Completion

The following records preserve the initial findings and their context. Completed
results appear in the Wave decisions below; unresolved items remain explicit
follow-up work rather than implied public commitments.

1. **Document-scoped default overlay ownership (complete).** Default
   dismissable-layer stacks now belong to their owner document. Independent
   documents, including iframes, no longer compete for the same topmost layer.
   The lookup is internal, while injected custom stacks remain available for
   advanced coordination in one document.
2. **Duplicate focus alias (complete).** `restoreFocus(element)` was removed
   because it only delegated to `focusElement(element)` and had no distinct
   behavior. `FocusStack.restore()` remains the focused API for a captured
   focus flow.
3. **Internal combobox type leakage (complete).** Components no longer export
   the implementation-named `CoreComboboxUpdateOptions` alias. The public
   contract exposes the component-level `ComboboxUpdateOptions` instead.
4. **Core combobox discoverability (complete).** `docs/core/combobox.md` now
   positions the core behavior layer beneath the composed Combobox component.
5. **Focus documentation (complete).** `docs/core/focus.md` now describes the
   current consumers and verified constraints without historical TreeView or
   speculative API notes.
6. **Owner-window consistency (complete).** Core Combobox now schedules blur
   handling and pointer cleanup through the input owner window, with a focused
   separate-document contract test.
7. **Global startup-scroll side effect.**
   `resetInitialScrollPosition()` intentionally sets
   `history.scrollRestoration` to `"manual"` for the lifetime of an app. This
   is useful for client-routed startup, but it is not a neutral utility
   default. Document it prominently and decide during the core API pass
   whether the returned controller should be able to restore the prior value.


## Wave 1 Decisions

### Keep

- DOM, ARIA, id, event, keyboard, collection, selection, and roving-focus
  helpers each have a narrow behavior contract. They are not artificial
  duplication and remain useful for progressive enhancement outside the
  composed component layer.
- Focus primitives remain separate from component focus policies. In
  particular, `FocusStack.restore()` captures a real flow, while components
  own their own modal restoration behavior.
- Document-coordinated live-region channels, scroll locks, validation policy,
  and injected custom overlay stacks have distinct resource ownership and
  should remain available to advanced consumers.
- `createX()` behavior APIs and `X()` composition APIs are complementary.
  Normal application code should start with composition or a public template;
  direct core APIs remain documented escape hatches.

### Clarify

- Core Combobox now has a dedicated guide that explicitly positions it below
  the composed `Combobox()` component.
- Focus and scroll documentation now describe current consumers and the
  lasting `history.scrollRestoration` effect of startup scroll reset.
- Before publication, package export maps should make normal component/app
  entries easy to discover without hiding supported low-level subpaths.

### Completed Pre-1.0 Changes

- Default overlay ordering is isolated per owner document; custom stacks remain injectable.
- The standalone `restoreFocus()` alias is gone; `FocusStack.restore()` remains
  the distinct API for a captured focus flow.
- `CoreComboboxUpdateOptions` no longer appears in the component public API.
- Core Combobox now schedules through the input owner window.

### Regression Coverage

- Two independent documents dismiss their active overlays without affecting one
  another's stack.
- A combobox in a separate document schedules blur cleanup through that
  document's window.
- Combobox keyboard selection, Escape closure, and responsive-navigation focus
  restoration are covered alongside the existing overlay contracts.

## Wave 2 Decisions

### Keep

- Composition primitives, `Image`, `Icon`, `IconLabel`, and `TrustedHtml` have
  distinct semantic roles. The explicit raw-markup boundary and noninteractive
  icon-label primitive are useful recent simplifications and need no further
  surface expansion.
- `Screen` owns a whole active application view, while `Section` owns a
  document subdivision. `StatusMessage` is inline workflow feedback and
  `ToastViewport` is global transient feedback; their scopes are different.
- `createPage()` remains the low-level semantic page owner used by `AppShell`.
  `AppShell` is the normal custom-application entry and public templates remain
  the normal starter entry, so these are a ladder rather than competing APIs.

### Clarify

- Added a dedicated Page guide and reference-map entry. It directs normal apps
  to public templates or `AppShell` and reserves `createPage()` for custom
  shell ownership.
- Keep interactive toast actions documented as a constrained convenience, not
  a required workflow mechanism. The playground and later browser review must
  verify keyboard access, timeout behavior, and an equivalent in-flow action.

### Follow Up

- Review whether `foundation` should continue to re-export selected core
  storage, validation, and startup-scroll helpers. The convenience is useful
  for source-first app imports, but the public guidance must name one preferred
  import path before npm packaging introduces subpath exports.
- Add a focused Page/AppShell contract test only when their lifecycle or
  document ownership changes. Current risk is lower than overlays, speech,
  validation, and responsive chrome.

## Wave 3 Decisions

### Keep

- Enhancement APIs (`createTextField`, `createSelect`, `createListbox`,
  `createMenu`, `createTabs`, `createDialog`, and similar) and composition APIs
  have distinct adoption paths. The former preserve author-owned DOM; the
  latter create a declarative component tree.
- Native form controls remain the default for fields, checkboxes, radio groups,
  and select. `Form` coordinates validation without replacing field semantics.
- `Navigation` is link-based and `Menu` is command-based. This is the correct
  semantic split for SPA, MPA, and static usage.
- Disclosure, Accordion, Popover, Tooltip, Dialog, and AlertDialog have
  distinct focus and announcement models. The existing description and
  announcement policy remains the shared standard.

### Clarify

- `Form` defaults to field-first validation speech: the first invalid control
  receives focus while aggregate announcements stay quiet unless a short
  summary is explicitly requested. This should remain the recommended path in
  component docs and playground examples.
- Tooltip, dialog, alert dialog, and popover contracts are now covered by the
  existing narrow tests; actual geometry and screen-reader wording remain
  browser/manual checks.
- `ToastViewport` is appropriate for non-blocking status. Its action and close
  controls must never be the only route to a required workflow. Do not grow
  toast interaction options until the framework offers a tested, discoverable
  in-flow notification route or a clear notification-center pattern.

### Regression Coverage

- A keyboard-focused Combobox contract verifies input focus,
  `aria-activedescendant`, Enter selection, and Escape closure.
- A ResponsiveNavigation contract verifies close-trigger focus restoration and
  keeps the inactive layout out of the Tab route.
- Keep the current form, tooltip, dialog, alert-dialog, and popover tests as
  their behavior contracts; do not replace them with implementation snapshots.

## Wave 4 Decisions

### Keep

- Locale controller, formatter, locale refresh, localized search, and locale
  diagnostics solve separate concerns. The normal application convenience is
  `createAppLocalization()`; the lower-level controller stays available for
  custom registries and nonstandard refresh wiring.
- `AppIdentity`, app metadata, manifest generation, robots generation, route
  metadata, and diagnostics are layered rather than duplicated. Identity
  centralizes app facts; metadata and manifest create different web-platform
  artifacts; diagnostics inspects results without silently changing them.
- Hash and native-link routing remain separate because browser behavior is
  materially different. `createPublicAppTemplate()` is the normal public start
  point, with mode-specific templates and renderers as documented advanced
  choices.
- `RouteChrome` correctly composes only the requested controls. Its opt-in
  object shape avoids future templates accumulating `false` flags for unused
  navigation, breadcrumbs, search, or commands.

### Clarify

- Locale detection remains preference-first: explicit app choice, saved choice,
  URL context when owned by the app, browser language preferences, then
  fallback. Geographic inference is intentionally not part of the default API.
- Public diagnostics are strict by design. Private or incomplete development
  apps should use generic diagnostics or deliberately configure their public
  checks instead of suppressing meaningful production warnings.
- `stringifyWebAppManifest(manifest)` and
  `createWebAppManifestJson(options)` are not duplicates: one serializes an
  existing manifest and the other creates then serializes a typed manifest.

### Follow Up

- Before npm publication, introduce deliberate package export maps and an
  import guide: normal components/app templates at the primary entry, core
  primitives and advanced routing through documented subpaths. Do not make
  source-first relative imports look like a published package contract.
- Add a small app-template integration test only after the public template API
  changes. Existing examples, the playground, Study Languages, diagnostics,
  and production builds currently provide the useful integration evidence.

## Wave 5 Decisions

### Keep

- Root barrels remain source-first convenience entries while the repository is
  private. They expose the complete current surface for examples, Playground,
  and AI-assisted repository work.
- Component and core APIs should stay discoverable through documentation maps
  instead of hiding advanced behavior from experienced consumers.

### Clarify

- Added `docs/core/README.md` and linked it from README, AGENTS.md, and
  llms.txt. It gives humans and agents one explicit place to choose a core
  module and explains when composition or enhancement APIs are preferable.
- The component reference now includes the previously omitted Page guide.
- The normal path is consistent across README, templates, AI guidance, and
  component docs: public template first, AppShell for custom app shells,
  composition for individual interface pieces, enhancement/core for
  author-owned DOM and reusable behavior.

### Next Audit Boundary

The four pre-1.0 source changes identified by this audit are implemented and
covered. The public API now has one less redundant focus helper, no
implementation-named Combobox update type, and correct document ownership for
default overlay and Combobox scheduling behavior.

The next review pass is in progress: Playground demonstrations and local CSS.
It compares every demo against documented defaults and advanced options, then
promotes only proven product-independent styling into the library.
## Evidence Sources

The audit uses four sources together:

- source ownership and public barrel exports;
- existing playground, starter, and Study Languages usage;
- focused contract tests for behavior that must not regress;
- desktop, mobile, and assistive-technology observations where browser or
  speech behavior is involved.

Browser-level geometry and real screen-reader speech remain manual or future
Playwright concerns; they are not inferred from DOM tests.

## Closure

The library audit is complete when every public family has one of the three
recorded decisions above, high-risk contracts have focused tests or an explicit
manual/browser test requirement, and the public-facing documentation describes
normal versus advanced entry points.

Only then does the next audit pass move to playground demonstrations and local
CSS. That pass will identify generic baseline styles which belong in the
library while preserving product-specific visual decisions in applications.
