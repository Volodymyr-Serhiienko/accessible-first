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
- Component baseline: Button, IconButton, Link, Disclosure, Accordion, Dialog, AlertDialog, Tabs, Listbox, Menu, Select, Combobox, Popover, Tooltip, Toast, Checkbox, RadioGroup, Switch, TextField, FieldGroup, FormSection, Form, DescriptionList, Breadcrumbs, ActionsBar, Navigation, ResponsiveNavigation, OverflowScroller, Brand, HeaderBar, AppHeader, EmptyState, InfoCard, Badge, Progress, SettingsGroup, Screen, ListDetail.
- App foundation: AppShell, PageLayout, PageOutlet, HashRouter, HashRoutedApp, LinkRoutedApp, App route helpers, route-derived Navigation/Search/Breadcrumbs/CommandPalette, RouteChrome, AppRouteChrome, HashAppRouteChrome, HashAppRouteChromeRenderer, LinkAppRouteChrome, LinkAppRouteChromeRenderer, AppHeader, FocusRoute.
- Metadata and public-web helpers: AppIdentity, DocumentMetadata, AppDocumentMetadata recipe, WebAppManifest and AppWebAppManifest recipe, sitemap helper, robots.txt helper, route-derived metadata helpers.
- Diagnostics baseline: page diagnostics, app diagnostics aggregation/runner, public app diagnostics recipe, public route diagnostics defaults, route-list inspection in the public runner, metadata, localization, and manifest checks.
- Localization baseline: LocaleController, document lang/dir synchronization, framework service-text registry, application locale template, LocaleFormatter, locale-aware search helpers, LanguageSelect, LocaleRefresh for app-owned chrome/screen updates without page reload.

## Active Phase: App Foundation Stabilization

Goal: make the framework ready for the first real application without carrying avoidable architectural debt.

Current focus:

1. Keep documentation aligned with the architecture.
2. Finish localization as a cross-cutting foundation, not a per-component patch.
3. Refine header, navigation, and app shell layout so real apps need minimal custom CSS.
4. Confirm SPA and MPA patterns share the same route metadata and native-link foundation.
5. Keep the playground useful as a living demo while extracting only repeated app patterns into the library.

### Now

- Keep header/navigation/mobile shell behavior stable after the HeaderTools and LocaleRefresh work.
- Harden `HashRoutedApp` and `LinkRoutedApp` as the first reusable app runtime recipes: SPA route rendering for hash routes, and native-link/MPA chrome plus metadata synchronization for normal links.
- Keep `HeaderBar` as the low-level header layout. Higher-level app templates should own sticky/reveal chrome decisions and decide when to use `HeaderTools`.
- Keep playground code focused on demo copy and examples, with app-owned identity shared by metadata, manifest, routes, localization, and diagnostics. Move reusable startup lifecycle, app header, route chrome, diagnostics, and workflow focus wiring into framework helpers.
- Keep both routed app recipes small, documented, and ready to feed future app templates before starting the first reference application. Hash SPAs should use `createHashAppRouteChromeRenderer` inside `HashRoutedApp`, or `createHashAppRouteChrome` when custom render code already has the router/current route. Native-link and MPA pages should use `createLinkAppRouteChromeRenderer` inside `LinkRoutedApp`.
- Keep localization diagnostics wired into app health reports through `createAppDiagnosticsRunner()` so missing service/app text is visible before release.

### Exit Criteria For This Phase

Before starting the first real application, we should have:

- one clear app shell recipe for SPA, backed by `HashRoutedApp`;
- one clear app shell recipe for MPA/native links, backed by `LinkRoutedApp`;
- app-owned identity and route metadata feeding navigation, search, breadcrumbs, document metadata, web app manifests, command palette, RouteChrome, locale refresh, and diagnostics;
- theme and locale handled at the app shell level;
- header/navigation responsive behavior documented;
- diagnostics reporting useful page, route-list, metadata, localization, manifest, and app-owned health issues through a public app diagnostics recipe;
- playground sections stable enough for desktop and mobile smoke checks.

## Next Phase: Application Templates And First Reference App

Goal: use Accessible First to build real application screens, then promote repeated patterns back into the framework.

Planned sequence:

1. Create app templates around `AppShell`, `PageOutlet`, `PageLayout`, `RouteChrome`, route metadata, metadata helpers, diagnostics, locale, and theme.
2. Add header/navigation variants only after the template needs them:
   - top navigation;
   - sidebar navigation;
   - mobile navigation;
   - expanded sticky/reveal shell behavior and header overflow patterns;
   - action overflow when header actions do not fit.
3. Build the first reference application: an accessible foreign-language learning app.
4. Use that application to validate real workflows:
   - lesson list and lesson detail;
   - vocabulary list/detail;
   - practice screen;
   - settings screen;
   - progress feedback;
   - form validation and user preferences;
   - desktop keyboard and mobile screen reader routes.
5. Promote repeated application code into reusable screen or shell patterns only when the repetition is proven.

## Component Expansion Queue

Do not create every possible component immediately. Build components when they unlock real app work or repeated playground patterns.

High-priority candidates:

- DataTable / Table primitives for structured data with captions, sorting, selection, and responsive alternatives.
- Pagination and result summary helpers.
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

- MPA current-route detection and native-link route chrome examples built on `LinkRoutedApp`;
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
