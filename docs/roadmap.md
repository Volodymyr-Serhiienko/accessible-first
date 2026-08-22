# Roadmap

## Completed Phase: Behavior Foundation

Completed:

- DOM
- Events
- ID
- Keyboard
- Focus
- ARIA
- Collection navigation
- Scroll utilities
- Roving focus
- Live region and announcer
- Disclosure behavior
- Dialog behavior
- Tabs navigation
- Listbox navigation
- Typeahead navigation
- Selection utilities
- Menu navigation
- Popover positioning
- Dismissable layer
- Overlay stack
- Form field semantics
- Validation announcements

---

## Current Phase: Accessible Components And Semantic Composition

Goal: build framework-independent, WCAG-oriented component primitives with accessible defaults, predictable behavior, semantic page composition, and minimal integration cost.

Completed:

- Component foundation
- Button
- Button speech/default audit
- Icon Button
- IconButton speech/default audit
- Link
- Link speech/default audit
- Disclosure
- Playground foundation
- Semantic Composition foundation
- Component composition API for Button, Icon Button, Link, and Disclosure
- Self-aware composition callbacks
- Page object API
- Semantic primitives: Section, Panel, Row, Stack, Group, Toolbar
- Responsive Grid primitive
- Container layout primitive for aligned page regions and responsive gutters
- Tag helpers
- Trusted Html composition helper
- System/light/dark page theme support
- Initial page diagnostics
- Icon helper
- Icon file-source support
- VisuallyHidden helper
- Accordion component
- Dialog component
- Alert Dialog component
- Tabs component
- Hover announcement helper
- Listbox component
- Menu component enhancement and composition APIs
- Select component enhancement and composition APIs
- Popover component enhancement and composition APIs
- Combobox core behavior, enhancement API, composition API, styles, and playground demo
- Tooltip enhancement and composition APIs
- Toast viewport enhancement and composition APIs
- Checkbox component enhancement and composition APIs
- Radio Group component enhancement and composition APIs
- Switch component enhancement and composition APIs
- TextField component enhancement and composition APIs
- FieldGroup component and playground demo
- FormSection component and playground demo
- DescriptionList component and playground demo
- Breadcrumbs component and playground demo
- ActionsBar component and playground demo
- Dialog and AlertDialog actions layout reuse ActionsBar
- FormSection actions layout reuse ActionsBar
- Shared control hint foundation and migration of Button, Link, and IconButton
- Accordion item descriptions aligned with Disclosure open-announcement behavior
- Toast action guidance: use Dialog or AlertDialog for required actions
- Dialog and AlertDialog focus/description documentation refinement
- Documentation structure consolidation: component docs now own Quick Start sections
- Dialog, AlertDialog, and Disclosure update APIs narrowed to runtime-safe options
- Breadcrumb separator updates preserve existing item DOM nodes
- Shared ARIA reference id helpers reused by hint, tooltip, and accordion logic
- Navigation and ResponsiveNavigation composition APIs
- Playground section navigation migrated to ResponsiveNavigation
- Brand component and Image/Img helper for real page headers
- Image presentation presets
- OverflowScroller component for long inline navigation, tab, and toolbar patterns
- Theme helpers and ThemeToggle component for reusable page/app theme switching
- PageOutlet component for replacing active application screens inside stable page shells
- PageLayout helper for sticky footer, contained regions, gutters, and page separators
- HeaderBar component for brand, search, and header actions layout
- HashRouter helper for lightweight PageOutlet-based screen switching
- SearchBox component built on Combobox for local result search
- Playground SearchBox over registered demo screens and component keywords
- EmptyState component and playground demo
- InfoCard component and playground demo
- Badge component for status, category, and metadata labels
- Badge speech/default audit
- Progress component for determinate and indeterminate task progress
- Progress speech/default audit
- SettingsGroup component for application preferences and configuration screens
- AppShell component as a thin application scaffold over createPage, PageOutlet, and PageLayout
- App route helpers for deriving navigation, search, breadcrumb items, and parent route trails from route metadata
- Screen component for top-level application views
- Playground main migrated to AppShell
- RouteBreadcrumbs component for deriving breadcrumb UI from route metadata
- Combobox and SearchBox setItems APIs for replacing dynamic result lists
- RouteSearchBox component for deriving route search UI from route metadata
- RouteResponsiveNavigation component for deriving responsive navigation UI from route metadata
- HashRouter route activation and binding helpers for route-aware navigation, search, and breadcrumbs
- CommandPalette component for searchable application commands and quick navigation
- RouteCommandPalette component for route-derived command search
- CommandPalette shortcut matching by key and physical code for non-Latin keyboard layouts
- App route location matching helper for native-link and multi-page current route detection
- Shared programmatic focus helper and Screen focus targets for focus-route patterns
- FocusRoute helper for repeated workflow focus movement in playground and future apps
- DocumentMetadata module and Page/AppShell metadata integration
- Route-derived document metadata helpers and HashRouter metadata callbacks
- App route diagnostics helper for route id, href, hierarchy, and metadata checks
- AppDiagnostics aggregate report for page, route, and future diagnostics sources
- DocumentMetadata canonical, robots, and manifest fields
- Page diagnostics strict document metadata options for public pages
- WebAppManifest helper for typed manifest JSON creation
- WebAppManifest diagnostics for identity, launch, colors, icons, and shortcuts
- DocumentMetadata Open Graph and Twitter/X social preview fields
- DocumentMetadata JSON-LD structured data field and diagnostics
- Route-derived sitemap helper for public pages and multi-page app artifacts
- RobotsTxt helper for crawler policy and sitemap discovery

In progress:

- Unified hint, tooltip, description, announcement, and toast model
- Component-by-component speech and description defaults audit
- Playground as living documentation
- Responsive playground refinement
- Playground AppShell and PageOutlet refinement
- Navigation patterns and responsive navigation
- Image, logo, and brand composition helpers
- Header actions such as theme, language, and user/profile controls
- Component examples and manual checklists
- Playground helper extraction review: keep demo-only glue in playground helpers and promote repeated application patterns into library helpers only when the pattern repeats
- Interaction scenario templates for desktop keyboard and mobile screen reader flows
- Keyboard shortcut model guidance for more advanced application-wide shortcut maps
- Shortcut patterns for desktop-first application workflows
- Documentation alignment with current architecture
- Form composition layer
- First app-building components such as EmptyState and InfoCard
- First reference application planning: accessible foreign-language learning app

Next:

- Application shell refinement for real single-page and multi-page apps
- Route metadata model expansion for multi-page app patterns
- Screen templates based on real app screens, such as settings, dashboard, list/detail, and lesson practice views
- ListDetail screen pattern for real app list/detail workflows
- Focus-route templates for screen reader friendly app screens
- App diagnostics and health report expansion for metadata, interaction checks, mobile UX checks, and SEO-oriented checks
- Metadata expansion for social preview assets and richer SEO checks
- Remaining Disclosure, Popover, Dialog, AlertDialog, FormSection, Screen, FieldGroup, SettingsGroup, and panel-like component description/announcement review
- Mobile playground layout cleanup after real-device checks
- Mobile screen reader UX research for SearchBox, Combobox, CommandPalette, navigation, and form controls
- Mobile screen reader form-control verbosity review for Checkbox, RadioGroup, Switch, and future fields
- Icon, Image, and Logo composition review
- Popover screen reader refinement after playground checks

Planned components:

- Navigation patterns, starting with native-link navigation that works for multi-page apps and can be intercepted by SPA-style shells

### Component Quality Baseline

Every component should define:

- accessible semantics by default;
- keyboard behavior where applicable;
- visible focus state;
- disabled state behavior;
- minimum practical target size;
- light and dark theme tokens;
- manual desktop checks;
- manual mobile checks;
- clear documentation examples;
- playground demo where useful.

---

## Semantic Composition Phase

Goal: provide a simple TypeScript-first API for creating accessible pages from semantic blocks, while reusing the same accessibility engine and enhancement components.

Completed:

- DOM adapter: createElement, append, mount
- Component composition API: Button, IconButton, Link, Disclosure
- Page object API: createPage, header, navigation, section, footer
- Semantic primitives: Section, Panel, Row, Stack, Group, Toolbar, Grid
- Tag helpers
- Trusted Html helper
- Console page report for development

Planned:

- Playground refactor into semantic demo modules
- More diagnostics for page structure and component usage
- Optional visual diagnostics overlay later
- GridCell or Cell primitive if explicit grid placement becomes necessary
- Image and Logo helpers for real page headers, cards, and branded surfaces
- Expanded Icon helper inputs for common icon sources when repeated use proves the API shape
- More semantic helpers only after repeated real use proves the need

---

## Page Building Phase

Goal: turn semantic composition into a practical way to build real pages and app screens.

Planned:

- Header patterns
- Navigation patterns based on real links first, so multi-page apps, static pages, server-rendered pages, and SPA shells share the same foundation
- Form shell and submit-validation pattern
- Responsive navigation with mobile collapse / burger behavior
- Main content patterns
- Footer patterns
- Page outlet pattern for rendering changing page content inside a stable shell
- Responsive layout patterns
- Small-screen control layout guidelines
- InfoCard
- EmptyState
- Badge
- Progress
- SettingsGroup
- Component composition guidelines
- Page-building examples in the playground

Important direction:

- Do not create too many page patterns before real examples exist.
- Use the playground and small demo pages to discover repeated patterns.
- Promote repeated compositions into named helpers only when they clearly reduce complexity.

---

## App Building Phase

Goal: provide reusable patterns for full application screens.

Planned:

- AppShell integration with playground and reference app examples
- Sidebar navigation
- Top navigation
- Mobile navigation
- Multi-page application shell patterns
- Lightweight client-side page routing / content switching pattern
- Foreign-language learning reference app as the first real application built with Accessible First
- Command menu
- Settings panels
- Dashboard patterns
- CRUD page patterns
- Loading states
- Error states
- Accessible notification system

---

## Styling And Theme Phase

Goal: provide accessible default styling without forcing a design framework.

Current direction:

- Default component styles are included.
- CSS custom properties are the main customization mechanism.
- Components should have practical accessible defaults.
- Common layout and navigation patterns should need minimal project-specific CSS.
- The library should not require Tailwind, CSS-in-JS, or a specific framework.

Planned:

- Typography scale
- Spacing scale
- Accessible color tokens
- Focus ring system
- Component density options
- More theme documentation
- Better responsive examples

---

## Playground And Validation Phase

Completed:

- Initial Vite playground shell
- Light and dark theme toggle
- First demos for Button, Icon Button, Link, and Disclosure
- Semantic composition demos
- Layout primitive demos
- Tabs demo
- Listbox demo

In progress:

- Playground as living documentation
- Responsive viewport demos
- Manual component checklists

Planned:

- Keyboard interaction demos
- Screen reader behavior notes
- GitHub Pages deployment
- Mobile device testing workflow
- Accessibility checklist per component
- Real page demos such as settings page or application shell
- Reference-app validation flow for the foreign-language learning application
- Automated unit tests for behavior utilities after APIs settle
- Playwright smoke tests for core component interactions after the playground stabilizes

### Planned Validation Flow

- Add manual testing notes for every component as it is created.
- Add every meaningful component to the playground.
- Use the playground for desktop keyboard testing, mobile touch testing, and screen reader smoke checks.
- Deploy the playground to GitHub Pages when the first component demos are stable.
- Add automated tests after the public API settles enough to avoid churn.

---

## Long-Term Goal

Accessible First should become a simple, framework-independent foundation for building accessible web applications.

The system should provide:

- low-level accessibility primitives;
- behavior modules;
- reusable accessible components;
- semantic page composition;
- page and application patterns;
- theme and responsive design foundations;
- diagnostics for development;
- app health diagnostics and metadata helpers;
- a playground for real-device testing and documentation.
