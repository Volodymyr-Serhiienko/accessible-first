# Study Languages Integration Audit - September 2026

## Purpose

This audit records what the first real Accessible First application has
revealed about the framework. It is deliberately narrower than the general
framework audit: the question here is which application code has proved to be
reusable infrastructure, which belongs to the Study Languages product, and
which proposed abstractions would be premature.

The evidence is the current Study Languages client: localized hash routing,
responsive route chrome, onboarding, preferences and progress persistence,
offline lesson content, accessible action feedback, and browser speech
synthesis for mixed-language material.

The audit does not move code automatically. A framework addition must still be
small, documented, tested, independent of product copy and data, and useful to
a second kind of application.

## What Already Works Well

The application is using the intended Accessible First layers rather than
rebuilding them locally:

- `createPublicAppTemplate()` owns the application shell, identity, metadata,
  diagnostics, locale refresh, and hash runtime;
- `createAppScreenRoutes()` and localized route text keep route metadata,
  navigation, breadcrumbs, document title, and route announcements aligned;
- `StatusMessage` and the document-scoped action announcer keep persistent
  feedback separate from one-shot screen-reader speech;
- `ActionsBar`, `Table`, `Section`, `Screen`, `EmptyState`, and native form
  controls provide the screen structure without application CSS components;
- `createVersionedStorage()` correctly owns validation and migrations of
  individual preference and progress records;
- `LanguageSelect` and `createAppLocalization()` keep interface locale,
  document language, and user selection reactive.

This is valuable evidence that the framework's present composition, app
template, localization, announcement, and semantic layout APIs are good
building blocks. The observed duplication is concentrated above individual UI
components, at application-service boundaries.

## Findings

### 1. Scoped Browser Storage Is Implemented

**Status: implemented and integrated.**

Study Languages currently keeps locale, learner preferences, and progress
inside one physical `localStorage` record. That is the correct application
outcome: it avoids a growing scatter of implementation keys in the browser and
makes an application's client state inspectable as one namespace. However,
the adapter in `apps/web/src/appStorage.ts` reimplements a storage facade,
JSON parsing, legacy-key migration, safe browser access, and cleanup.

The pattern is not language-learning-specific. It will recur for every
offline-capable AF application that owns several `createVersionedStorage()`
records.

The extracted core module is intentionally small:

- `createScopedStorage()` accepts a physical key, an optional `StorageLike`
  backend, and an explicit mapping of legacy physical keys;
- it returns the existing minimal `StorageLike` contract, so
  `createVersionedStorage()` and `createAppLocalization()` work unchanged;
- scoped values remain raw strings inside one envelope. The scope must not
  parse or version individual records; each record's owner already does that;
- the scope envelope has a stable format marker but no application-facing
  version. Typed records keep their own versions and migrations;
- migration copies raw legacy values only after the new envelope is written,
  and removes old keys only after that succeeds;
- parse, browser, and migration failures are exposed through a non-fatal
  error callback while unrecognized physical data is left untouched.

This removes application-specific special cases such as treating the locale as
raw text while preferences are JSON. It also preserves the user's desired
mental model: one app state record, with record-level versions only where data
actually needs migration.

The covered contract now verifies:

- independent scopes do not see each other's records;
- raw values round-trip unchanged through the scope;
- legacy keys migrate atomically enough to avoid deletion before persistence;
- malformed scope data is isolated without corrupting unrelated browser keys;
- `createVersionedStorage()` and `createAppLocalization()` work through a
  scoped backend.

### 2. Browser Speech Is Implemented As An Optional Capability

**Status: implemented and integrated.**

The Study Languages speech implementation is not merely page code. Its
contracts are product-neutral:

- a request is an ordered list of language-tagged segments;
- a segment may be read as normal text or spelled character by character;
- rate can differ by segment and volume applies to a request;
- one playback exposes state, pause, resume, stop, and subscription;
- an engine reports availability and replaces an active playback safely;
- browser Web Speech is one adapter, not the permanent only implementation.

The reusable layer now lives in `packages/core/src/speech/`, does not depend on
components, and contains no English UI text. It exposes the neutral
`SpeechEngine` contract and `createBrowserSpeechEngine()`. Application or
provider adapters may later implement the same contract for recorded audio or
a remote speech service.

The core contract is paired with two composition helpers:

- `SpeechControls()` for start/pause/resume/stop plus optional inline status;
- `SpeechButton()` for a compact control that plays one supplied request.

Both must receive all labels, icons, status wording, announcement policy, and
failure wording from the application. The framework must not insert English
copy into a product UI. Their only job is accessible button state, playback
lifecycle, cleanup, and the already-established one-event/one-announcement
rule.

The browser implementation needs an explicit documented limitation: browsers
may refuse speech that is not initiated by a user gesture. The framework should
make a visible Start action easy to build; it must not promise automatic speech
on screen load. This is a platform constraint, not an application defect.

The covered contract verifies:

- ordered multilingual segment queue and per-segment rate selection;
- spell mode retains letters and numbers from Unicode scripts, always ignores
  punctuation, and can speak whitespace when an application supplies a
  localized label for it;
- stop invalidates stale completion events;
- pause/resume follows the documented browser strategy;
- unavailable and failed playback have deterministic states;
- starting a new request stops the previous playback;
- component helpers do not announce static text or duplicate a supplied status
  message.

Manual browser checks remain required for actual voice quality, supported
voices, mobile gesture policies, and NVDA, TalkBack, and VoiceOver speech.

### 3. Exact-ID Routing Will Not Scale To Remote Lesson Catalogs

**Priority: initial hash implementation complete; validate before broader extraction.**

Study Languages currently creates four exact hash routes per lesson: lesson
hub, learning, materials, and grammar. That is readable with two local
lessons, but it has a structural ceiling. A large or remotely updated catalog
would create hundreds or thousands of route objects during startup, while a
newly synchronized lesson would have no route until the application is rebuilt
and redeployed.

The framework's current hash router deliberately matches only exact `id`
values. This keeps small apps simple, but it is the missing capability that
will matter most as the reference application gains content.

The appropriate future feature is **parameterized route matching**, not a
Study Languages lesson router. The design must cover both hash and native-link
modes from the same route descriptor family:

- a route declares a stable pattern, for example `lesson/:lessonNumber/learn`;
- a matcher returns decoded, validated parameters or no match;
- route rendering and localized route text receive typed parameters;
- href construction encodes parameters rather than concatenating strings in
  pages;
- metadata, breadcrumbs, navigation, diagnostics, and current-route controls
  distinguish a route definition from a resolved route instance;
- static routes remain the default and preserve their existing API and tests.

The proposed boundary and required contract checks are recorded in
[Parameterized Routes Design - September
2026](./parameterized-routes-design-2026-09.md). The next validation must keep
public route identity, breadcrumb ancestry, diagnostics, and search indexing
unambiguous. In particular, the lesson catalog screen should list available
lessons, while internal parameterized activity routes should not automatically
become thousands of top-level navigation items.

### 4. Cached Async Resources Need a Small Provider Boundary, Not a Large Data Layer

**Priority: validate with the next remote or editable source.**

`createIndexedDbLessonContentRepository()` correctly performs a useful local
workflow today: hydrate memory from IndexedDB, synchronize a selected key from
a source, validate content, retain a cached value when the source fails, and
write a fresh value back to IndexedDB. Its `LessonContentPackage`, source
fingerprint, lesson key, and content validation are all product concerns.

There is a possible reusable core underneath it, but one application is not
enough evidence to choose cache policy. The next step is to introduce a small
app-local provider boundary and use it once with a second source, such as an
editable/imported source or an HTTP source. Then extract only the repeated
mechanics:

- `AsyncResourceSource<TKey, TValue>` to load a typed value;
- a cache adapter with `read`, `write`, and optional `clear`;
- a clear result state that distinguishes ready, unavailable, stale fallback,
  invalid response, and failure;
- application-owned validation, cache key construction, freshness comparison,
  retry wording, loading visuals, and empty states.

Do not introduce a generic data-fetching framework, global store, or implicit
HTTP client. Those would make AF heavier without helping static and MPA users.
The first extraction should be a framework-independent cache adapter that works
for IndexedDB, memory, and future user-provided stores.

### 5. The Learning Flow Is Promising, But Must Stay Product-Local For One More Cycle

**Priority: do not extract yet.**

`LessonLearningPage` has a well-defined linear flow: a user starts explicitly,
receives an instruction/target pair, repeats or spells it, advances through
stages, writes progress, and receives a completion result only after speech
finishes. This is a strong product feature, but not yet a generic component.

It currently couples:

- learning stages (`word`, `phrase`, `sentence`);
- progress persistence keyed by target language and lesson;
- localized lesson position wording;
- Chinese pronunciation display;
- speech settings and completion timing;
- the lesson content schema.

The next learner mode, such as recall or review, should first share a small
app-local `learning-flow` controller with the current page. If both flows need
the same lifecycle, extract a domain-neutral `SequentialActivityController`:
items, current position, start/next/reset, completion, and change events.
It must not own learning copy, persistence, scoring, speech, or visual layout.
Only that evidence would justify a future Stepper/Wizard-adjacent component.

### 6. Several Useful Refactors Belong In The Application, Not The Framework

The following should make Study Languages easier to maintain now, but are not
framework APIs:

- centralize language-marked text and optional pronunciation in one local
  helper instead of rebuilding `lang`, `dir`, and pinyin spans in screens;
- centralize paired speech-request construction in the local speech feature;
- give lesson pages one app-local context/guard helper so empty and locked
  states do not repeat; the domain decision remains local;
- split `lessonLearning.ts` into a pure flow controller, local content
  mapping, and composition view before it grows with images and recall modes;
- keep product-level lesson hierarchy and redirect policy local while the new
  parameterized route contract is validated;
- use `SettingsGroup` where the setup page's nested settings need a labelled
  preference group, but do not create a product-specific settings form
  component.

The short `announcements.ts` wrapper should stay. It gives the application one
obvious entry point for non-visual feedback while still using the shared
document channel. A second notification abstraction would make the existing
announcement policy harder, not easier, to understand.

## Non-Goals

The current evidence does **not** justify moving any of these into AF:

- lesson, vocabulary, grammar, pinyin, language-pair, level, or progress data
  models;
- seed-data fingerprints or a lesson-specific IndexedDB schema;
- automatic lesson unlocking, learning-scoring policy, or pedagogical content;
- a global application state container;
- automatic image generation or an image-selection policy;
- an admin UI, import/export format, authentication, or billing layer before
  the product workflows exist;
- a wrapper that hides normal `Section`, `Table`, `StatusMessage`, or
  `ActionsBar` use behind a Study-specific convenience API.

Keeping these boundaries firm is how AF stays smaller and clearer than a
generic application framework while still removing genuine repeated work.

## Recommended Sequence

1. Completed: extract `createScopedStorage()` in core, migrate Study Languages
   to it, align localization with `StorageLike`, and cover the record/migration
   contract with tests.
2. Completed: extract browser speech and its composition controls, then replace
   the app's browser engine and controls without changing its product workflow.
3. Completed initial hash implementation: validate parameterized lesson,
   activity, and breadcrumb routes in Study Languages before extending native
   links, sitemap, public metadata, and route-registry behavior.
4. Add the next learning mode and a second content provider. Use the evidence
   to decide whether a sequential activity controller and async cache adapter
   should join the framework.

Each completed extraction must update the relevant API guide, AI guidance,
playground or runnable example where it teaches a normal workflow, contract
tests, and the general roadmap. The Study Languages app remains the manual
desktop/mobile/screen-reader proving ground.

## Success Measures

The goal is not to maximize the number of framework modules. The integration
will be improving the framework when:

- a new app can place all client records under one logical browser-storage
  namespace without writing a storage facade;
- a new app can use speech with no browser-global code, no hidden English UI
  text, and a clear visible user-gesture path;
- a content-rich app can route to a newly loaded item without generating a
  static route per item;
- applications keep ownership of their copy, data schemas, learning/product
  rules, and visual choices;
- every promoted layer has a small documented API, deterministic tests, and
  a manual accessibility scenario;
- basic screens remain straightforward to compose from the existing semantic
  components and baseline styles.
