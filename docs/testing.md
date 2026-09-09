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
npm run check
```

`npm run check` runs the type check, contract suite, playground build, and both
starter builds in that order. It is the local pre-push gate.

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
- `ThemeToggle` reflects an already-applied target theme, announces one completed\n  change, and keeps switch semantics synchronized with external target changes;
- `ToastViewport` renders a non-modal region, announces one shown message,
  respects visible limits and timeouts, and restores its host state on destroy;
- versioned storage migrates valid records, persists the migration, and
  notifies subscribers about later changes;
- `IconLabel()` stays semantic-neutral and cleans up child composition, while
  ordinary composition remains text-safe and `TrustedHtml()` is the explicit
  raw-markup boundary;
- `createAppLocalization()` reacts to locale changes, updates document language,
  keeps formatting reactive, and has no duplicate `.locale` alias;
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

The next automated layer is browser coverage for high-risk journeys: tooltip
persistence and viewport placement, dialogs and popovers, validation and route
announcements, sticky chrome focus visibility, responsive navigation, locale
refresh, and narrow-screen reflow. These tests will complement, not replace,
the manual NVDA, VoiceOver, and TalkBack matrix in the framework audit.
