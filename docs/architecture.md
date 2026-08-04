# Accessible First Architecture

## Vision

Accessible First is a framework-independent ecosystem for building accessible web applications.

Instead of starting with a visual component library, the project starts from reusable accessibility behavior and builds upward into components, semantic composition, page patterns, and application patterns.

The goal is to make accessibility the default, not an afterthought.

---

## Architectural Layers

```text
Applications and demos
    |
    v
Page and app patterns
(AppShell, Sidebar, SettingsPage, EmptyState...)
    |
    v
Semantic composition
(createPage, Section, Panel, Row, Stack, Grid, Html, tags...)
    |
    v
Composition components
(Button, IconButton, Link, Disclosure, Dialog, AlertDialog, Tabs...)
    |
    v
Enhancement components
(createButton(element), createDisclosure(root, options)...)
    |
    v
Behavior
(Focus, Keyboard, ARIA, Collection, Roving Focus...)
    |
    v
Platform
(DOM, Events, ID, Scroll, Live Region...)
    |
    v
Browser APIs
```

Each layer depends only on the layer below it.

Higher-level modules should not bypass lower-level abstractions unless there is a clear architectural reason.

## Public API Surfaces

Accessible First has two main public surfaces.

### Enhancement API

The enhancement API improves existing HTML.

Example:

```ts
createButton(existingButton, {
    variant: "primary"
});
```

Use this when HTML already exists or when integrating with another rendering system.

### Composition API

The composition API creates DOM and enhances it.

Example:

```ts
const save = Button({
    text: "Save",
    variant: "primary",
    onPress(event, button) {
        button.setText("Saved");
    }
});
```

Use this when building pages directly with Accessible First.

Some composition components also add small usability helpers around browser and assistive technology differences. For example, tabs can announce their visible label on mouse hover without adding a native `title` tooltip.

## Semantic Composition

Semantic composition is the page-building layer.

It should help developers organize interfaces as meaningful regions and blocks instead of long nested DOM trees.

Current primitives include:

* createPage;
* Section;
* Panel;
* Row;
* Stack;
* Grid;
* Group;
* Toolbar;
* tag helpers such as P, H1, H2, Ul, Li;
* Html for trusted native HTML fragments.

This layer does not replace components. It gives components a readable page structure.

## Layout Strategy

Layout primitives should stay small and predictable.

Row and Stack cover simple directional composition.

Grid is currently a responsive flow grid for arranging blocks and panels. It is not intended to become a full CSS Grid replacement immediately.

Future grid control may be added through a separate Cell or GridCell primitive if real examples show that explicit row, column, span, or area placement is needed.

## Styling Strategy

Accessible First should provide usable default styles.

Default styles should include:

* visible focus indicators;
* practical target sizes;
* accessible disabled states;
* light and dark theme tokens;
* basic spacing and typography;
* component state styling.

The library should not require Tailwind, CSS-in-JS, or a specific design framework.

Customization should happen through:

* CSS custom properties;
* normal CSS selectors;
* component variants;
* future theme tokens.

## Diagnostics Strategy

The page layer should help developers notice structural issues during development.

page.inspect() should report issues such as:

* missing landmarks;
* multiple main landmarks;
* missing or multiple h1;
* sections without headings;
* navigation without an accessible name;
* duplicate IDs;
* broken ARIA references;
* interactive controls without accessible names.

Later diagnostics may include a visual overlay, responsive checks, component checklists, and playground validation helpers.

## Development Workflow

Each module follows the same lifecycle:

1. Design
2. Implementation
3. Manual testing
4. Refactoring
5. Documentation
6. Playground integration where useful

Only after completing this cycle should development move to the next major module.

## Long-Term Goal

The long-term goal is to create a complete accessibility-first platform that enables developers to build high-quality web applications using well-designed, reusable, documented, and accessible building blocks.
