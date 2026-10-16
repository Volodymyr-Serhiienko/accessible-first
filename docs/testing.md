# Testing And Toolchain

Accessible First uses a layered quality gate. Automated checks protect stable,
repeatable contracts. Manual browser and assistive-technology testing protects
real interaction and speech quality. Neither layer replaces the other.

## Maintainer Toolchain

- Node.js 24 LTS is the supported development and CI runtime. Node.js 20 is
  end-of-life and is not a supported maintainer environment.
- npm manages the committed lockfile. Use `npm ci` for a clean, reproducible
  install in CI or when investigating a dependency issue.
- TypeScript 6 is the current compiler baseline. The repository uses strict
  typing, `exactOptionalPropertyTypes`, and `noUncheckedIndexedAccess`.
- Vite 8 builds the playground and runnable starters.

Node.js is a development/build dependency. A browser consuming the built
framework does not need Node.js at runtime. Browser support is a separate
policy and must be validated by browser-level tests and the manual matrix.

Do not use `npm audit fix --force` as routine maintenance. Review a major
upgrade separately; commit the resulting `package-lock.json` with the change.

## Commands

```bash
npm run typecheck
npm test
npm run playground:build
npm run example:routed:build
npm run example:static:build
npm run example:audio:build
npm run check
npm audit --audit-level=high
```

`npm run check` runs the type check, contract suite, playground build, both
starter builds and the recorded-audio example. Before pushing, also run
`npm audit --audit-level=high`: GitHub Pages requires this separate security gate.
The audit needs network access and checks the committed dependency tree. For a
dependency failure, reproduce `npm ci --no-audit --no-fund` first, update only the
affected compatible package and commit the lockfile; do not bypass the CI audit.

## Current Contract Suite

Vitest runs the contract suite in `jsdom`. It intentionally does not assert
visual pixels or emulate a screen reader.

The current suite protects these public contracts:

- document-scoped announcement channels share the polite/assertive pair,
  preserve a newer announcement owned by another channel, clean up only after
  the final owner, and alternate repeated text;
- `StatusMessage` keeps visible feedback separate from event feedback: it
  announces only when explicitly requested and never destroys an injected
  application announcer;
- `ThemeToggle` reflects an already-applied target theme, announces one completed
  change, and keeps switch semantics synchronized with external target changes;
- `ToastViewport` renders a non-modal region, announces one shown message,
  respects visible limits and timeouts, and restores its host state on destroy;
- versioned storage migrates valid records, persists the migration, and
  notifies subscribers about later changes; scoped storage isolates raw records,
  migrates legacy physical keys only after persistence, and works with both
  versioned storage and localization;
- browser speech queues multilingual segments, filters spelling input, can
  speak localized whitespace while omitting punctuation, guards stale
  completion events, refreshes cached voice resolution when the browser
  reports changed voices, documents pause/restart behavior, exposes
  unavailable playback, and backs composition controls with native buttons;
- `IconLabel()` stays semantic-neutral and cleans up child composition, while
  ordinary composition remains text-safe and `TrustedHtml()` is the explicit
  raw-markup boundary;
- `createAppLocalization()` reacts to locale changes, updates document language,
  keeps formatting reactive, and has no duplicate `.locale` alias; LanguageSelect
  and LanguageCombobox keep automatic labels reactive, while the latter defers
  a locale change until explicit selection;
- `createTooltip()` restores author attributes, honors Escape without moving
  focus, and uses the coordinated live region only for an explicit hover
  announcement;
- document-owned overlay stacks isolate independent documents during Escape
  dismissal;
- Core Combobox keeps input focus for keyboard selection and schedules blur
  cleanup through the input owner window;
- ResponsiveNavigation closes its mobile panel and restores focus to the
  trigger.
- Dialog, AlertDialog, and Popover preserve semantic trigger/content relations,
  safe dismissal defaults, configured announcements, and focus restoration;
- Composed Disclosure, Accordion, and Popover keep a visible description out of
  initial trigger speech, announce that concise context when opening, and retain
  their expected panel and dismissal behavior;
- ResultSummary remains quiet unless live updates are explicitly enabled;
  EmptyState, InfoCard, Badge, Progress, Table, and DescriptionList preserve
  their native semantic structures; Badge replaces abbreviated visible text with
  an explicit screen-reader label using `aria-hidden="true"` on that visual text;
- TextField, Select, Checkbox, Switch, and RadioGroup retain native control,
  label, description, value-change, and grouping semantics; only Switch adds
  the explicit `role="switch"` contract;
- FieldGroup remains a native fieldset and attaches important group instructions
  by default; FormSection and SettingsGroup keep their descriptions as visible
  content unless `descriptionMode: "aria"` explicitly requests extra speech;
- Breadcrumbs, Navigation, and Pagination preserve native navigation semantics:
  path separators remain hidden, current items carry `aria-current`, and
  Pagination uses buttons for local state or links when a page URL exists;
- Section and Group add labels only when meaningful, while Container, Panel,
  Row, Stack, and Grid remain semantic-neutral; Screen preserves a labelled
  section, quiet description default, and stable programmatic focus fallbacks;
- `Menu` keeps command semantics, hover feedback, disabled-item safety, selection,
  and Escape close requests intact; `Tabs` keeps tab-panel relations, hover
  feedback, selection state, and disabled-tab safety intact;
- validation policy keeps automatic form feedback quiet when focus already
  exposes the invalid field, while explicit summaries remain announceable;
  Form invokes `onReset` only after native reset cleanup and optional
  first-field focus restoration;
- `PageOutlet()` focuses a new screen heading without duplicate default speech
  and announces a title only when no focus route is selected.

Add tests when a public behavior is fixed, extended, or found to regress. Prefer
asserting semantics, state, lifecycle, and native interaction over snapshots of
implementation markup.

## Manual And Browser Checks

`jsdom` cannot prove layout, CSS forced-colors behavior, touch exploration,
viewport positioning, browser focus timing, or screen-reader speech. Continue
testing those flows in the deployed and local playground, templates, and real
applications.

### Browser Style Contracts

From the AF repository, run `npm run test:styles`, then open
`http://[::1]:3260/` and activate **Run checks** with the keyboard. The isolated
fixture uses actual framework CSS, Section/Stack and collection components;
it has no application accounts, analytics, API calls or speech generation.
The port is loopback-only and strict: stop an earlier instance or choose another
port with `npm run test:styles -- --port 3261` if needed.

It checks native hidden/reveal behavior and focus rejection for common roots,
`until-found` against the browser's native result, unrelated author-style
isolation, and the first/last Menu/Listbox focus outline within the scroll
viewport. Cases include default/plain, vertical/horizontal and enlarged focus
tokens. Repeat at desktop/narrow widths, with both themes and directions;
inspect the actual outlines as well as the geometry report.

This is an explicit browser regression fixture, not part of `npm run check` or
an automated CI browser runner. `jsdom` tests must not be described as CSS layout
coverage. Other components, forced colors, 200% zoom, long localized content and
real screen-reader speech still need their own checks.

The same server exposes `/focus.html`: **Run focus checks** exercises actual
fieldset/legend, hidden/inert/read-only availability, semantic heading focus and
blur cleanup, dynamic roving items, nested Tab traps and same-origin iframe
ownership. The persistent Menu/Listbox/Tabs/Dialog below it are native-keyboard
fixtures for arrows, prefix typing, Tab/Shift+Tab and Escape/focus return. These
checks do not certify virtual-keyboard dismissal on a physical mobile device.

`/tab-order.html` adds native Tab/Shift+Tab probes for stable positive-tabindex
order, checked/unchecked radio groups and empty traps. **Inspect candidates**
compares native and older-engine visibility paths for nested closed details and
skipped content. Activate/deactivate one trap at a time. The composed form/text
dialogs exercise RadioGroup, Combobox, nested Escape and focus return without
application accounts or server calls. Native key actions, not synthetic keydown
events in jsdom, verify actual browser movement.

`/collections.html` exercises pre-mount defaults, rendered hidden-item filtering,
runtime direction changes and horizontal Menu/Listbox/manual Tabs alongside a
vertical menu. Hide/show middle items, toggle direction and use actual arrows,
Home/End, prefix typing and Enter. **Inspect collections** exposes current state,
Tab stops and the detached core menu's logical disabled flags. The style fixture
also checks hidden internal menu items, options and tab buttons, not just roots.

`/search-palette.html` checks SearchBox/CommandPalette and route wrappers without
server data. **Run search checks** verifies filtering, empty/disabled results,
focus ownership, full-width palette input and long unbroken labels/descriptions.
Use actual typing/arrows/Enter, Ctrl+K, Tab and Escape to verify command focus,
modal return and route payloads at desktop/narrow widths in both themes. This is
a DOM/CSS/keyboard fixture, not a screen-reader or physical-device acceptance test.

`/language-pickers.html` checks the native and confirmed language pickers with a
shared controller: label/option identity, pending selection, external synchronization,
native-name language metadata, width, RTL and long unbroken labels. Use actual
arrows/Enter, Space, Escape and native select changes alongside **Run language
checks**, at desktop/narrow widths in both themes. This does not prove native
mobile popup behavior or multilingual screen-reader pronunciation.

`/responsive-navigation.html` checks native links, separate leading controls,
chrome-only updates, current/return focus, mobile close, long labels and RTL
overflow. Run **Run navigation checks** with Enter to exercise `:focus-visible`.
Use Tab/Space/Enter and resize between desktop/narrow widths while a navigation
item is focused; also verify external input focus survives resizing. Repeat in
both themes and directions, including the last overflow item. This is a real
DOM/CSS/keyboard fixture, not proof of physical mobile or screen-reader behavior.

`/speech-controls.html` checks group/toggle/compact speech actions without a remote
service. **Run speech checks** covers terminal state, stale callbacks, feedback,
reserved labels, focus ownership and narrow layouts. Repeat at desktop/mobile
widths, both themes and RTL with native Enter/Space/Tab. **Play local WAV** uses a
locally generated four-second tone through the real recorded-audio engine; verify
pause/resume/stop, natural completion and focus return. It makes no Google/API
request and does not prove speech quality, autoplay or real mobile/AT compatibility.

`/page-shell.html` checks stable chrome identity/values/focus, owned main append,
native landmarks, optional-region hide/reveal and long content with real page CSS.
Run **Run page shell checks** with Enter at desktop/narrow widths in both themes
and directions. Activate the skip link with Enter, then Tab to the first main
control; **Focus main** must work with Space without adding a normal tab stop.
This covers the base shell, not fixed/reveal geometry, real AT or physical mobile.

`/page-outlet-lifecycle.html` checks nested renders from cleanup, focus callbacks
and native focus events; stale title/speech/scroll effects, pending-message
replacement, foreign-document focus and terminal mutations. Run **Run outlet checks**
with Enter/Space at desktop/narrow widths, both themes and directions. A completed
run returns focus to its action. The fixture uses scroll counters to verify frame
ownership; it does not prove physical scrolling geometry or actual AT speech order.

`/page-layout.html` covers that geometry separately: normal/sticky/fixed/reveal and
mixed stacks, app/document modes, flow reservations, contained context width,
height changes and hidden strips. Use the fixed fixture tools to scroll down/up,
focus or expand the header and grow its text; repeat at desktop/narrow widths,
light/dark and RTL, including **Toggle top offset**. **Remove layout** verifies authored CSS priority restoration.
The fixture disables transition animation for deterministic geometry, not in the
library. It does not prove real AT, transformed/nested scroll layouts or mobile
keyboard/visual-viewport behavior.

`/document-metadata.html` checks live head ownership, title/language, native tag
identity, stable icons/JSON-LD, preparation failure, reset/destroy and terminal
updates. Run **Run metadata checks** with Enter at desktop/narrow widths, both
themes and RTL; verify the action keeps focus and the authored document state is
restored. The fixture also exercises scoped page diagnostics without external
services. It does not prove search indexing or actual screen-reader language speech.

## Public Discovery Contracts

`/template-refresh.html` checks nested static/hash/link refreshes using real button
controllers, cleanup reentry, abandoned handlers, route-control binding lifetime
and superseded link metadata. Run **Run refresh checks** with Enter/Space at
desktop/narrow widths, both themes and directions. Accepted controls stay live;
obsolete controls must not keep handlers or subscriptions. This is synchronous
runtime ownership coverage, not a guarantee for arbitrary application side effects
or real screen-reader speech.

`/template-construction.html` checks the initial factory-to-shell handoff with real
button controllers: failed resolvers/content, partial shell construction, pending
regions, caller-owned static content, original exceptions and normal destruction.
Run **Run construction checks** with Enter/Space at desktop/narrow widths, both
themes and directions. Failed trees must release click handlers without changing
the existing page's focus, title or theme. This is initial preparation coverage,
not a transaction or reentrancy guarantee for runtime chrome/route refresh.

`/public-recipes.html` exercises live identity refresh, final route JSON-LD,
explicit initial native-link selection, route title retention and failed mount
cleanup. Run **Run public recipe checks** with native Enter/Space at desktop and
narrow widths, both themes and directions. Checks must restore the authored
document and preserve the action's focus; they do not claim actual AT behavior.

Public discovery helpers have focused contracts in `robotsTxt.test.ts` and
`appRouteSitemap.test.ts`: crawler group boundaries, single-line values, URL/date
diagnostics and parsed XML round trips. These run without networking and do not
prove crawling/indexing. Consumer HTTP tests must separately check root placement,
content types, HEAD/cache policy, private noindex and unknown-path 404 behavior.

## Browser Regression Fixtures

`/navigation-overlay-styles.html` covers Navigation variants, ResponsiveNavigation,
Tabs, Menu/Listbox, Disclosure/Accordion, Breadcrumbs/Pagination, OverflowScroller,
fixed/absolute Popover, Dialog, Form and header account/theme controls. Repeat
**Run navigation and overlay checks** at desktop/390px, both themes and enlarged
text; LTR/RTL are explicit. Check native manual tab activation, dropdown arrows
and Escape. **Open tall dialog/popover** checks scrolling to the last action and
return focus. Focus **rtl tooltip probe** to check wrapped text without scrollbars.
Theme-switch geometry disables its transition only in the fixture; real motion,
physical zoom, forced-colors, on-screen keyboards and AT remain separate checks.

`/container-styles.html` (the `tests/browser` Vite root) checks native tables,
DescriptionList, ListDetail, InfoCard, EmptyState, Screen, form sections,
Panel/Section and ResultSummary. Run **Run container checks** at desktop/390px,
both themes and **Toggle enlarged text**; explicit LTR/RTL and narrow embedded
panels are included. Wide tables must scroll locally, while non-scrolling tables
with ordinary text reflow. Press Enter/Space on a sort header, then Tab to the
focusable row: sorting retains its button and the row outline remains inset.
Inspect actual media, long labels and focus; geometry assertions do not certify
screen-reader speech, forced-colors, real 200% zoom or other browser engines.

`/field-feedback-styles.html` checks default/plain TextField, PasswordField,
native Select, Combobox (including free-width popups), FieldGroup, status tones,
native Progress and bounded Toasts. Repeat **Run field and feedback checks** in
both themes at desktop/390px and with **Toggle enlarged text**. Use a pointer
click on **Probe selected option hover** for the actual selected/hover contrast.
With **Show tall notification**, focus its action then Tab to its close button:
the viewport must scroll the focused controls into view without clipping focus.
Inspect indeterminate Progress in different animation phases. Client-bound popup
tests cover scrollbars, fixed/absolute strategy and same-origin iframe documents.
Text enlargement is not real browser zoom; native picker internals, other browser
engines, reduced motion, forced-colors paint and actual AT still need manual checks.

`/control-styles.html` (the `tests/browser` Vite root) checks Button/IconButton's
four action variants, pressed/pending/disabled presentation, native and enhanced
icon targets, Link's three variants, Checkbox/RadioGroup marks and Switch geometry.
Run **Run control style checks** in both themes at desktop/390px, then repeat with
**Toggle enlarged text**. The surfaces include explicit LTR and RTL containers.
Use native Space on the checkbox/switch and check the visible indicator ring.
The 32px-text mode is a text-enlargement check, not real 200% browser zoom or AT
acceptance. `styleTokenContrast.test.ts` reads the actual palette through CSSOM;
only that token stylesheet is enabled for Vitest raw CSS imports.

`/hash-router-reentry.html` (the `tests/browser` Vite root) checks nested route
render/cleanup, stale result disposal with real button handlers, stop/retry,
title retention and quiet keyboard focus. Run **Run router checks** with Enter
and Space at desktop/narrow widths, light/dark and RTL. **First route** and
**Second route**, followed by browser Back/Forward, check native history and
heading focus. Unit contracts additionally cover metadata/title/announcement,
history hooks, matchers, navigation controls, subscriptions and startup failures.
These checks do not replace actual screen-reader announcement-order evaluation.

## Playground Loading

Use a production playground build when checking code splitting. The default
Markup section is synchronous; other demos load their individual modules through
AF `LazyContent`. Confirm direct hashes, navigation/search, fast route changes,
and locale/theme changes at desktop/narrow widths. English demo bodies keep
`lang="en"`; loading/failure feedback uses the shell locale.

With one demo JS request intentionally unavailable, navigation must show a
localized failure and **Reload page** action, not a blank outlet or automatic
reload loop. Browsers can cache rejected imports, so this action refreshes the
document rather than retrying the same import. Use keyboard Enter and verify
the selected route recovers. A late import must not replace a newer route.
Report entry plus modulepreloads as the initial JS graph, not entry size alone.

## Accessibility Evaluation Boundary

Accessible First uses WCAG 2.2 AA as an engineering target. Passing the quality
gate, diagnostics, automated accessibility scans, or one manual check is not a
conformance claim. A formal claim needs a defined application scope,
representative user journeys, recorded browser and assistive-technology results,
and an evaluation method such as [WCAG-EM](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/).

## Browser Compatibility

AF demo production builds use the explicit profile in `build/browserTargets.ts`:
ES2019, Chrome 87, Edge 88, Firefox 78, Safari 14.1 and iOS 14.5. These are build
targets, not certified browser/assistive-technology results. Consuming apps own
their support policy; there is no OS/model/User-Agent gate in the framework.
Vite transforms syntax, not missing browser APIs ([Vite compatibility](https://vite.dev/guide/build.html#browser-compatibility)).
Older/native-ESM-incompatible browsers require a separately tested legacy build,
not just a smaller target value. No legacy/polyfill bundle is shipped by default.

Optional capabilities degrade independently: Cache Storage/Web Locks can fall back
to session memory/serialized work; absent Intl.Segmenter makes recorded spelling
unavailable, not ordinary audio. An app may explicitly choose another spelling
provider. MP3 playback still requires a user gesture and a usable HTML audio API.
Web Speech is required only when an app deliberately selects its browser engine.
Styles provide `vh` before `dvh` and a `:focus` fallback for browsers without
`:focus-visible`; newer cosmetic selectors are progressive enhancements.

Representative manual journeys:

- Windows with Chrome or Edge and NVDA;
- macOS with Safari and VoiceOver;
- Android with Chrome and TalkBack;
- iOS with Safari and VoiceOver;
- keyboard-only desktop at normal and 200% zoom;
- touch, landscape, text enlargement, reduced motion, and forced-colors or
  high-contrast modes where the platform provides them.

Test a journey rather than only a component: route changes, form errors and
success feedback, disclosures and overlays, mobile navigation, settings changes,
and a long-content page. Record known support limits instead of implying that a
DOM contract proves speech quality or platform behavior.

The next automated layer is browser coverage for high-risk journeys: tooltip
persistence and viewport placement, dialogs and popovers, validation and route
announcements, sticky chrome focus visibility, responsive navigation, locale
refresh, and narrow-screen reflow. These tests will complement, not replace,
the manual compatibility matrix above.
