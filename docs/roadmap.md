# Roadmap

Accessible First is moving from a component library into a small framework for building accessible web applications. The roadmap is intentionally organized as a working plan, not as a complete history log.

## Current Direction

The project goal is a lightweight, framework-independent foundation for building accessible SPA and MPA web applications.

Accessible First should provide:

- low-level accessibility behavior modules;
- enhancement APIs for existing HTML;
- composition APIs for creating interfaces directly;
- semantic page and app shell primitives;
- accessible UI components with practical defaults;
- localization, theme, metadata, diagnostics, and responsive layout foundations;
- a playground that acts as living documentation and real-device testing surface;
- reusable application patterns proven by real applications.

## Status Legend

- **Stable foundation** - usable and documented, with only normal refinements expected.
- **Active** - current work area.
- **Next** - planned soon, before major new product/application work.
- **Later** - important, but should wait until real examples justify the final API shape.

## Stable Foundation

These layers are strong enough to build on:

- Platform utilities: DOM, events, IDs, keyboard helpers, focus helpers, ARIA helpers, scroll utilities including startup scroll reset, collection helpers.
- Behavior modules: roving focus, live regions, disclosure, dialog, tabs, listbox, typeahead, selection, menu, popover positioning, dismissable layer, overlay stack, form-field semantics, validation announcements.
- Core composition: createElement, mount, Page object, semantic primitives, tag helpers, trusted HTML, Icon, Image, VisuallyHidden.
- Theme baseline: system/light/dark page theme, ThemeToggle, component tokens, accessible focus and contrast defaults.
- Component baseline: Button, IconButton, Link, Disclosure, Accordion, Dialog, AlertDialog, Tabs, Listbox, Menu, Select, Combobox, Popover, Tooltip, Toast, Checkbox, RadioGroup, Switch, TextField, FieldGroup, FormSection, Form, DescriptionList, Breadcrumbs, ActionsBar, Navigation, ResponsiveNavigation, OverflowScroller, Brand, HeaderBar, AppHeader, EmptyState, InfoCard, Badge, Progress, Pagination, ResultSummary, SettingsGroup, Table, Screen, ListDetail.
- App foundation: AppShell, PageLayout, PageOutlet, HashRouter, HashRoutedApp, PublicHashRoutedApp, PublicHashAppTemplate, PublicAppTemplate, LinkRoutedApp, PublicLinkRoutedApp, PublicLinkAppTemplate, App route helpers, AppRouteRegistry, route-derived Navigation/Search/Breadcrumbs/CommandPalette, RouteChrome with breadcrumb root and navigation return-link support, AppRouteChrome, HashAppRouteChrome, HashAppRouteChromeRenderer, LinkAppRouteChrome, LinkAppRouteChromeRenderer, AppHeader with identity-derived brand defaults, FocusRoute.
- Metadata and public-web helpers: AppIdentity, DocumentMetadata, AppDocumentMetadata recipe, WebAppManifest and AppWebAppManifest recipe, sitemap helper, robots.txt helper, identity-derived route metadata and diagnostics helpers.
- Diagnostics baseline: page diagnostics, app diagnostics aggregation/runner, public app diagnostics recipe, public route diagnostics defaults, route-list inspection in the public runner, identity-derived manifest checks, metadata, localization, and manifest checks.
- Localization baseline: LocaleController, document lang/dir synchronization, framework service-text registry, application locale template, LocaleFormatter, locale-aware search helpers, localized route text resolvers, LanguageSelect, LocaleRefresh for app-owned chrome/screen updates without page reload.

## Active Phase: App Foundation Stabilization

Goal: make the framework ready for the first real application without carrying avoidable architectural debt.

Current focus after the result/list foundation:

1. Keep documentation aligned with the architecture.
2. Finish localization as a cross-cutting foundation, not a per-component patch.
3. Refine header, navigation, and app shell layout so real apps need minimal custom CSS.
4. Confirm SPA and MPA patterns share the same route metadata and native-link foundation.
5. Keep the playground useful as a living demo while extracting only repeated app patterns into the library.

### Now

- Keep header/navigation/mobile shell behavior stable after the HeaderTools and LocaleRefresh work.
- Treat `ResultSummary` as the small bridge between SearchBox, Pagination, lists, and future DataTable work: static by default, optionally live for dynamic filtering.
- Keep `createPublicAppTemplate()` as the standard public-app entry point, with `PublicHashAppTemplate` and `PublicLinkAppTemplate` remaining available for explicit mode-specific docs and custom code.
- Keep `HeaderBar` as the low-level header layout. Higher-level app templates should own sticky/reveal chrome decisions and decide when to use `HeaderTools`.
- Keep playground code focused on demo copy and examples, with app-owned identity shared by metadata, manifest, routes, localization, and diagnostics through top-level public app recipe options. Move reusable startup lifecycle, app header, route chrome, diagnostics, and workflow focus wiring into framework helpers; keep after-outlet navigation return routes declarative through route chrome options.
- Keep both routed app recipes small, documented, and ready to feed future app templates before starting the first reference application. Hash SPAs should use `createHashAppRouteChromeRenderer` inside `HashRoutedApp`, or `createHashAppRouteChrome` when custom render code already has the router/current route. Native-link and MPA pages should use `createLinkAppRouteChromeRenderer` inside `LinkRoutedApp`.
- Keep localization diagnostics wired into app health reports through `createAppDiagnosticsRunner()` so missing service/app text is visible before release.
- Keep shaping the first app starter from real playground wiring instead of adding unrelated components.
- Keep `playground/main.ts` thin and move app-owned wiring into a single playground app factory so the future starter and first reference app can follow the same entry shape.
- Keep route registry, resolver-backed shell/outlet options, and localized route text helpers as the playground template pattern, so app-owned navigation, search, breadcrumbs, announcements, metadata, and diagnostics refresh from one locale source before starting the first reference app.
- Use localized route `routeOptions` as the default bridge between route metadata and diagnostics, so starter apps do not repeat title/description resolver glue.
- Keep public hash/link templates sharing one internal shell-refresh and diagnostics-defaults path, so SPA and MPA starters do not drift apart.

### Exit Criteria For This Phase

Before starting the first real application, we should have:

- one clear public SPA template, backed by `PublicHashAppTemplate`, `PublicHashRoutedApp`, and the lower-level `HashRoutedApp`;
- one clear public MPA/native-link template, backed by `PublicLinkAppTemplate`, `PublicLinkRoutedApp`, and the lower-level `LinkRoutedApp`;
- app-owned identity and route metadata feeding navigation, search, breadcrumbs, document metadata, WebPage JSON-LD, web app manifests, command palette, RouteChrome, public routed app recipes, locale refresh, and diagnostics;
- theme and locale handled at the app shell level;
- header/navigation responsive behavior documented;
- diagnostics reporting useful page, route-list, metadata, localization, manifest, and app-owned health issues through a public app diagnostics recipe;
- playground sections stable enough for desktop and mobile smoke checks.

## Next Phase: Application Templates And First Reference App

Goal: use Accessible First to build real application screens, then promote repeated patterns back into the framework.

Planned sequence, ordered toward the first usable generated app:

1. Use `createPublicAppTemplate()` as the single teachable public-app entry, while keeping hash and link templates as explicit lower-level recipes.
2. Keep [Application Blueprint](./app-blueprint.md) as the architecture contract and [Application Starter](./app-starter.md) as the practical first-app recipe: identity, routes, route registry, localized route text, locale file, metadata, manifest, diagnostics, header tools, route chrome, layout, and focus routes.
3. Remove duplicated app-shell glue from the playground only when the blueprint abstraction is cleaner than the current code.
4. Add a lightweight application scaffold/generator once the starter recipe is stable enough to create a site without manual wiring.
5. Treat the stable scaffold as the handoff point for the legacy language-learning app code: after this point, the old app can be reviewed and migrated instead of guessed from memory.
6. Generate a small first-site prototype from that scaffold: home screen, navigation, metadata, manifest, locale file, diagnostics, and one or two content screens.
7. Start the first reference application: an accessible foreign-language learning app, migrated from the legacy project into the new Accessible First app structure.
8. Validate real workflows in that application: lesson list/detail, vocabulary list/detail, practice screen, settings screen, progress feedback, form validation, user preferences, desktop keyboard routes, and mobile screen reader routes.
9. Add header/navigation variants only when the first app or generated site needs them: top navigation, sidebar navigation, mobile navigation, sticky/fixed/reveal chrome, and action overflow.
10. Promote repeated application code into reusable screen or shell patterns only when the repetition is proven.
11. Keep component expansion tied to the reference app, not to a theoretical catalog.

## Component Expansion Queue

Do not create every possible component immediately. Build components when they unlock real app work or repeated playground patterns.

High-priority candidates:

- DataTable extensions on top of native Table for sorting, selection, pagination, and responsive card alternatives.
- Drawer / SidePanel / Sheet for non-modal and modal side content, especially mobile layouts.
- Toolbar improvements and command/action grouping.
- Stepper / Wizard for guided multi-step workflows.
- FileUpload built on native input with accessible validation and progress.
- Slider / Range using native input first.
- Avatar / UserMenu / ProfileAction for app headers.
- Loading, Skeleton, ErrorState, and retry patterns for async screens.
- Modal and non-modal application panels based on Dialog, Popover, and DismissableLayer.

Lower-priority or research-heavy candidates:

- Calendar / DatePicker, only with a native-first fallback and careful mobile testing.
- Virtualized large lists, only when performance needs are proven.
- Rich text editor patterns, only after core app patterns are stable.
- Advanced charts, only with accessible data summaries and keyboard-independent alternatives.

## Cross-Cutting Decisions To Settle Early

These topics can cause expensive refactors if postponed too long.

### Localization And Internationalization

Already started. Continue to keep all framework-owned user-facing service text behind `LocaleController`.

Need next:

- harden the app-owned translation file template against the first real app;
- keep `inspectLocaleController()` in app diagnostics for required framework and app-owned message keys;
- refine `LocaleRefresh` into higher-level app templates only after real repeated patterns appear;
- richer pluralization strategy on top of `Intl.PluralRules` categories;
- locale-aware indexed/server-backed search patterns beyond lightweight in-memory filtering;
- RTL layout smoke tests and diagnostics beyond document direction synchronization.

### Theme, Tokens, And Density

Default styles should remain accessible and lightweight.

Need next:

- clearer token documentation;
- density presets for comfortable/compact UI;
- typography scale and readable line lengths;
- component size consistency;
- dark-theme glare checks for primary surfaces, tooltips, and selected states.

### Responsive Shell, Header, And Navigation

Header, navigation, search, language, theme, command palette, and future profile controls must compose well across desktop, tablet, and mobile.

Need next:

- app-level shell modes: normal, sticky/fixed, reveal-on-scroll;
- header action wrapping and overflow strategy built on `HeaderTools`, with later shell templates deciding when to use normal, sticky, fixed, or reveal app chrome;
- compact search behavior;
- desktop overflow navigation without clipped focus;
- mobile navigation that remains visually clear and screen-reader understandable.

### Routing, SPA, And MPA

Navigation should start from real links so MPA, static pages, server-rendered pages, and SPA shells can share the same route metadata.

Need next:

- MPA current-route detection and native-link route chrome examples built on `PublicLinkAppTemplate` and `LinkRoutedApp`;
- `HashRoutedApp` and `LinkRoutedApp` examples side by side;
- canonical URL and sitemap guidance for hash routes;
- route diagnostics for missing titles, descriptions, hrefs, parents, and metadata.

### Forms And Validation

Validation should be field-first, form-aware, and quiet enough for screen readers.

Need next:

- form-level validation summary pattern;
- async validation hooks;
- field success/error visual indicators;
- rules for when live-region validation is useful and when focus should own the message.

### Hints, Descriptions, Announcements, And Toasts

The current model is good. Keep enforcing it.

Need next:

- avoid duplicated speech when focus already reads the target;
- keep important information visible for touch and non-screen-reader users;
- keep toast actions non-critical until a reliable focus route exists.

### Diagnostics And Health Reports

Diagnostics should become one of the framework's strongest differentiators.

Need next:

- localization diagnostics;
- responsive/mobile risk diagnostics where detectable;
- duplicate or missing route metadata diagnostics;
- SEO/public-page readiness diagnostics;
- optional visual diagnostics overlay later.

### Assets, Icons, And Images

The icon and image model should stay flexible before many components depend on it.

Need next:

- document icon source choices;
- keep IconButton flexible for paths, SVG strings, image files, and composed icon nodes;
- image presets for content images, logos, avatars, thumbnails, and cards.

## Playground Direction

The playground should be living documentation, not a second framework.

Keep in playground:

- demo-only strings and examples;
- simple local helpers that do not repeat across real apps;
- manual testing sections;
- real-device layout checks.

Promote into the library:

- repeated accessibility behavior;
- repeated route/app shell wiring;
- repeated focus routes;
- repeated responsive shell/header/navigation patterns;
- repeated diagnostics checks.

## Validation Direction

Manual validation stays important because screen reader and mobile behavior cannot be fully trusted to unit tests.

Use this flow:

1. Add or update the component/pattern.
2. Document expected behavior.
3. Add or update playground demo when useful.
4. Smoke test desktop keyboard and screen reader behavior.
5. Smoke test mobile touch and screen reader behavior when the pattern affects mobile UX.
6. Add automated tests after the public API stabilizes enough to avoid churn.

## Long-Term Goal

Accessible First should become a small but serious web application framework: easier than large UI frameworks for accessible apps, lighter than full virtual-DOM stacks, and more opinionated about WCAG-friendly defaults, semantics, diagnostics, and real user workflows.
