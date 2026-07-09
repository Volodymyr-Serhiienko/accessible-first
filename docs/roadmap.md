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

## Current Phase: Accessible Components

Goal: build framework-independent, WCAG-oriented component primitives with accessible defaults, predictable behavior, and minimal integration cost.

Completed:

- Component foundation
- Button
- Icon Button

In progress:

- Link

Planned:

- Disclosure
- Accordion
- Dialog
- Alert Dialog
- Tabs
- Listbox
- Menu
- Select
- Combobox
- Tooltip
- Popover
- Toast
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
- clear documentation examples.

---

## Page Building Phase

Planned:

- Semantic page sections
- Header patterns
- Navigation patterns
- Main content patterns
- Footer patterns
- Responsive layout primitives
- Light and dark theme tokens
- Typography scale
- Spacing scale
- Accessible color tokens
- Focus ring system
- Component composition guidelines

---

## App Building Phase

Planned:

- Application shell
- Sidebar navigation
- Top navigation
- Mobile navigation
- Command menu
- Settings panels
- Dashboard patterns
- CRUD page patterns
- Empty states
- Loading states
- Error states
- Accessible notification system

---

## Playground And Validation Phase

Planned:

- Playground as living documentation
- Keyboard interaction demos
- Screen reader behavior notes
- Responsive viewport demos
- Light and dark theme demos
- GitHub Pages deployment
- Mobile device testing workflow
- Accessibility checklist per component

### Planned Validation Flow

- Add manual testing notes for every component as it is created.
- Create a playground after Button, Icon Button, and Link are stable.
- Use the playground for desktop keyboard testing, mobile touch testing, and screen reader smoke checks.
- Deploy the playground to GitHub Pages when the first component demos are ready.
- Add automated unit tests for behavior utilities after the component API settles.
- Add Playwright smoke tests for core component interactions after the playground exists.

---

## Long-Term Goal

Accessible First should become a simple, framework-independent foundation for building accessible web applications.

The system should provide:

- Low-level accessibility primitives
- Behavior modules
- Reusable accessible components
- Page and application patterns
- Theme and responsive design foundations
- A playground for real-device testing and documentation
