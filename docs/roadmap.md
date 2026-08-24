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

- Platform utilities: DOM, events, IDs, keyboard helpers, focus helpers, ARIA helpers, scroll utilities, collection helpers.
- Behavior modules: roving focus, live regions, disclosure, dialog, tabs, listbox, typeahead, selection, menu, popover positioning, dismissable layer, overlay stack, form-field semantics, validation announcements.
- Core composition: createElement, mount, Page object, semantic primitives, tag helpers, trusted HTML, Icon, Image, VisuallyHidden.
- Theme baseline: system/light/dark page theme, ThemeToggle, component tokens, accessible focus and contrast defaults.
- Component baseline: Button, IconButton, Link, Disclosure, Accordion, Dialog, AlertDialog, Tabs, Listbox, Menu, Select, Combobox, Popover, Tooltip, Toast, Checkbox, RadioGroup, Switch, TextField, FieldGroup, FormSection, Form, DescriptionList, Breadcrumbs, ActionsBar, Navigation, ResponsiveNavigation, OverflowScroller, Brand, HeaderBar, EmptyState, InfoCard, Badge, Progress, SettingsGroup, Screen, ListDetail.
- App foundation: AppShell, PageLayout, PageOutlet, HashRouter, App route helpers, route-derived Navigation/Search/Breadcrumbs/CommandPalette, FocusRoute.
- Metadata and public-web helpers: DocumentMetadata, WebAppManifest, sitemap helper, robots.txt helper, route-derived metadata helpers.
- Diagnostics baseline: page diagnostics, app diagnostics aggregation, route diagnostics, metadata and manifest checks.
- Localization baseline: LocaleController, framework service-text registry, application locale template, LanguageSelect.

## Active Phase: App Foundation Stabilization

Goal: make the framework ready for the first real application without carrying avoidable architectural debt.

Current focus:

1. Keep documentation aligned with the architecture.
2. Finish localization as a cross-cutting foundation, not a per-component patch.
3. Refine header, navigation, and app shell layout so real apps need minimal custom CSS.
4. Confirm SPA and MPA patterns share the same route metadata and native-link foundation.
5. Keep the playground useful as a living demo while extracting only repeated app patterns into the library.

### Now

- Roadmap and overview documentation cleanup.
- Verify locale switching across AppShell, route components, command palette, search, header actions, toasts, dialogs, and text-field service messages.
- Define the next header/navigation model:
  - normal page flow;
  - sticky/fixed header and navigation;
  - refine reveal-on-scroll header/navigation behavior after mobile testing;
  - compact responsive header action layout for search, language, theme, commands, and future profile controls.
- Decide whether `HeaderBar` remains a low-level layout component and whether higher-level app header templates should own sticky/reveal behavior.
- Improve mobile header compactness where search or actions take too much space.
- Keep route wrappers safe from self-recursive `Object.assign()` update patterns.
- Prepare the first app-template plan for both SPA and MPA usage.

### Exit Criteria For This Phase

Before starting the first real application, we should have:

- one clear app shell recipe for SPA;
- one clear app shell recipe for MPA/native links;
- route metadata feeding navigation, search, breadcrumbs, metadata, command palette, and diagnostics;
- theme and locale handled at the app shell level;
- header/navigation responsive behavior documented;
- diagnostics reporting useful page, route, metadata, localization, and manifest issues;
- playground sections stable enough for desktop and mobile smoke checks.

## Next Phase: Application Templates And First Reference App

Goal: use Accessible First to build real application screens, then promote repeated patterns back into the framework.

Planned sequence:

1. Create app templates around `AppShell`, `PageOutlet`, `PageLayout`, route metadata, metadata helpers, diagnostics, locale, and theme.
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

- app-owned translation file template;
- reactive app text strategy without forcing a heavy runtime;
- locale-aware number/date formatting helpers;
- pluralization strategy;
- locale-aware search/sort options;
- RTL direction support and diagnostics.

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
- header action wrapping and overflow strategy;
- compact search behavior;
- desktop overflow navigation without clipped focus;
- mobile navigation that remains visually clear and screen-reader understandable.

### Routing, SPA, And MPA

Navigation should start from real links so MPA, static pages, server-rendered pages, and SPA shells can share the same route metadata.

Need next:

- MPA current-route detection examples;
- hash-router and native-link examples side by side;
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
