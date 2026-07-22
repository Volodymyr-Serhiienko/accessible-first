# Principles

## Accessibility By Default

Accessible behavior should be the easiest path.

Components should provide correct semantics, keyboard behavior, focus handling, names, relationships, and state attributes by default where applicable.

## Native HTML First

Use native browser semantics and behavior whenever possible.

Prefer real buttons, links, headings, sections, labels, inputs, dialogs, and landmarks over custom roles unless a custom pattern is necessary.

## Progressive Enhancement

The lower-level API should support improving existing HTML.

The higher-level composition API should create accessible DOM and then reuse the same enhancement engine.

## Simplicity First

Avoid abstractions that make the project harder to learn, debug, or maintain.

A feature should earn its place by improving accessibility, developer experience, performance, or long-term maintainability.

## Lightweight Runtime

The project should remain framework-independent and avoid heavy runtime machinery.

Signals, virtual DOM, advanced builders, and large reactive systems are future possibilities only if real application examples prove they are needed.

## Semantic Composition

Pages should be built from meaningful blocks, not only from nested DOM nodes.

The composition layer should help developers express page structure clearly:

- header;
- navigation;
- main sections;
- panels;
- rows;
- stacks;
- grids;
- toolbars;
- future application patterns.

## Useful Defaults, Customizable Tokens

Components should look and behave acceptably by default.

Default styles should cover:

- focus indicators;
- minimum practical target sizes;
- disabled states;
- light and dark themes;
- accessible color contrast;
- spacing and typography basics.

Customization should be possible through CSS custom properties and normal CSS, without requiring Tailwind or a specific design framework.

## Composition Over Monoliths

Prefer small reliable primitives that can be combined.

Higher-level patterns should be added only after repeated real use shows that a composition is common enough to deserve a named abstraction.

## Perceivable Component Context

Interactive components should help users understand what kind of control they are focused on and what activation is likely to do.

For composite components, the project should prefer semantic structure, accessible names, state attributes, and helpful relationships over hidden instructions that duplicate screen reader output.

Examples:

- disclosure triggers should expose expanded or collapsed state;
- accordion triggers should be understandable as section headers;
- panels should be clearly related to their triggers;
- complex widgets should not rely on one keyboard interaction model that screen readers may intercept.

## Documentation Driven

Architectural decisions, public APIs, component behavior, and testing expectations should be documented as the project evolves.

The playground should become living documentation.

## Validate With Real Interfaces

Do not design the API only in theory.

Use the playground and small real page examples to discover what is actually convenient, missing, confusing, or too complex.# Principles
