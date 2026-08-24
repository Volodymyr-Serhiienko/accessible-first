# Vision

Accessible First aims to make web accessibility the default, not an option.

The project should help developers build high-quality web applications that are accessible, understandable, lightweight, responsive, and pleasant to maintain.

## Product Vision

Accessible First should become a simple, framework-independent foundation for creating accessible web applications.

It should provide:

- reliable low-level accessibility behavior;
- accessible components with safe defaults;
- semantic composition tools for building pages;
- responsive layout primitives;
- light and dark theme foundations;
- development diagnostics;
- localization and internationalization for framework service text and application copy;
- metadata, SEO, PWA, and public-page helpers;
- a playground that acts as living documentation and a real-device testing surface.

## Framework Direction

Accessible First should grow toward real application development, not only isolated widgets. The framework should help a developer start with accessible defaults for page structure, theme, localization, routing, metadata, diagnostics, and responsive behavior before they write large amounts of application glue.

The first real validation target is an accessible foreign-language learning application. It should prove that the same foundation can support practical screens, forms, navigation, feedback, preferences, and mobile use without forcing a large UI runtime.

## Developer Experience Vision

The developer should not start from raw DOM complexity or from a large framework requirement.

The preferred mental model is:

```ts
const page = createPage();

page.header(Header());
page.navigation(Navigation());
page.section(ButtonsDemo());
page.section(LayoutDemo());
page.footer(Footer());
```

Large pages should be organized as meaningful blocks, not as unreadable trees of nested elements.

The library should help developers think in terms of interface meaning:

* page regions;
* sections;
* panels;
* actions;
* forms;
* navigation;
* feedback;
* application patterns.

## Accessibility Vision

Every component and page primitive should prefer accessible behavior by default:

* native HTML semantics whenever possible;
* keyboard support where expected;
* visible focus states;
* practical touch target sizes;
* accessible names and relationships;
* safe disabled states;
* light and dark theme contrast;
* screen reader friendly state changes.

## Scope Vision

Accessible First has two complementary surfaces:

1. Enhancement API for improving existing HTML.
2. Composition API for creating accessible interfaces from semantic blocks.

Both surfaces should reuse the same behavior engine.

The project should stay lightweight. It should not introduce a virtual DOM, a required framework, or a heavy runtime unless a future need clearly justifies it.
