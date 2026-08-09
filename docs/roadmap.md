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
- Icon Button
- Link
- Disclosure
- Playground foundation
- Semantic Composition foundation
- Component composition API for Button, Icon Button, Link, and Disclosure
- Self-aware composition callbacks
- Page object API
- Semantic primitives: Section, Panel, Row, Stack, Group, Toolbar
- Responsive Grid primitive
- Tag helpers
- Trusted Html composition helper
- System/light/dark page theme support
- Initial page diagnostics
- Icon helper
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
- Shared control hint foundation and migration of Button, Link, and IconButton
- Accordion item descriptions aligned with Disclosure open-announcement behavior
- Toast action guidance: use Dialog or AlertDialog for required actions
- Documentation structure consolidation: component docs now own Quick Start sections

In progress:

- Unified hint, tooltip, description, announcement, and toast model
- Playground as living documentation
- Responsive playground refinement
- Component examples and manual checklists
- Documentation alignment with current architecture

Next:

- Remaining Disclosure, Popover, Dialog, and AlertDialog description/announcement naming review
- Mobile playground layout cleanup after real-device checks
- Icon, Image, and Logo composition review
- Popover screen reader refinement after playground checks
- Dialog and Alert Dialog documentation refinement after more screen reader checks

Planned components:

- Form Field
- Checkbox
- Radio Group
- Switch

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
- Navigation patterns
- Responsive navigation with mobile collapse / burger behavior
- Main content patterns
- Footer patterns
- Page outlet pattern for rendering changing page content inside a stable shell
- Responsive layout patterns
- Small-screen control layout guidelines
- DescriptionList
- ActionsBar
- InfoCard
- EmptyState
- FieldGroup
- SettingsGroup
- FormSection
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

- Application shell
- Sidebar navigation
- Top navigation
- Mobile navigation
- Multi-page application shell patterns
- Lightweight client-side page routing / content switching pattern
- Breadcrumbs
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
- a playground for real-device testing and documentation.
