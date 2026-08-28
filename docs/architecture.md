# Accessible First Architecture

Accessible First is a framework-independent accessibility foundation for web applications.

The architecture starts with small behavior modules and builds upward into enhancement APIs, composition components, semantic page construction, and later application patterns.

## Layer Model

```text
Applications and demos
    |
Application shells and route helpers
    |
Page and app patterns
    |
Semantic composition
    |
Composition components
    |
Enhancement components
    |
Behavior modules
    |
Platform utilities
    |
Browser APIs
```

Each layer should depend only on the layer below it.

Higher layers may combine lower layers, but they should not duplicate their behavior. For example, a component should reuse the core focus, keyboard, ARIA, and selection modules instead of reimplementing them locally.

## Cross-Cutting Foundations

Some framework decisions affect almost every component and should be treated as foundation work, not as late add-ons:

- localization and internationalization;
- theme tokens, density, and responsive sizing;
- header, navigation, and app shell behavior;
- SPA and MPA route metadata;
- document metadata, SEO, PWA, and public-page artifacts;
- diagnostics and health reporting;
- hints, descriptions, announcements, and validation speech;
- mobile touch and mobile screen reader interaction routes.

When a new component creates user-facing service text, layout behavior, metadata, focus movement, or diagnostics, it should connect to the shared foundation instead of creating a local one-off rule.

## Public Surfaces

Accessible First has two main public surfaces.

Enhancement API:

```ts
createButton(existingButton, {
    variant: "primary"
});
```

Use enhancement APIs when HTML already exists or when another renderer owns the DOM.

Composition API:

```ts
const save = Button({
    text: "Save",
    variant: "primary"
});
```

Use composition APIs when building pages directly with Accessible First.

The two surfaces should reuse the same behavior engine.

Application shell API:

```ts
const shell = AppShell({
    header: Header(),
    navigation: Navigation(),
    footer: Footer()
});

shell.render(HomeScreen());
```

Use shell APIs when building full applications with stable page regions and changing screen content.

Application route helpers:

```ts
const navigationItems = createAppRouteNavigationItems(routes);
const searchItems = createAppRouteSearchItems(routes);
const trail = createAppRouteTrail(routes, "settings");
const breadcrumbItems = createAppRouteBreadcrumbItems(trail);
```

Use route helpers and route-aware components when one route list should feed navigation, search, breadcrumbs, parent route trails, and routing metadata.

## Interaction Scenarios

Accessible First should treat interaction as a first-class design surface, not only as component behavior.

For every reusable app pattern, design and test at least two related scenarios:

- desktop keyboard and screen reader flow, where Tab, Shift+Tab, arrows, headings, landmarks, descriptions, and shortcuts shape the experience;
- mobile touch screen reader flow, where users explore controls and content through touch navigation, swipe navigation, rotor/local context menus, and virtual keyboard behavior.

These scenarios are related, but not identical. A good desktop Tab route does not automatically make a good mobile screen reader route. Components should provide clear names, descriptions, hints, focus targets, and visible alternatives so application patterns can be understandable in both modes.

Keyboard shortcuts are useful accelerators for desktop applications, but visible controls and semantic navigation must remain available. Shortcuts should never be the only path to a core action.

## Architecture Rules

- Prefer native HTML semantics before custom roles.
- Keep core behavior framework-independent.
- Put repeated accessibility behavior in shared utilities.
- Keep labels, hints, descriptions, announcements, tooltips, and toasts conceptually separate.
- Keep component APIs small, but expose escape hatches through native attributes and DOM access.
- Restore component mutations on `destroy()`.
- Add page and app patterns only after real examples prove they are useful.
- Prefer real links and route metadata before SPA-only abstractions, so static pages, multi-page apps, server-rendered pages, and client-side shells can share one navigation model.
- Save original child-component methods before extending composed objects with `Object.assign()`, so wrapper `update()` methods cannot accidentally call themselves.

## Documentation Map

- Project vision: [vision.md](./vision.md)
- Design principles: [principles.md](./principles.md)
- Hints and announcements: [hints-and-announcements.md](./hints-and-announcements.md)
- Page-building API: [semantic-composition.md](./semantic-composition.md)
- Application shell: [components/app-shell.md](./components/app-shell.md)
- App route helpers: [components/app-routes.md](./components/app-routes.md)
- Component reference: [components/README.md](./components/README.md)
- Application blueprint: [app-blueprint.md](./app-blueprint.md)
- Development plan: [roadmap.md](./roadmap.md)

## Development Workflow

Each module should move through the same cycle:

1. Design
2. Implementation
3. Manual testing
4. Refactoring
5. Documentation
6. Playground integration where useful

This keeps the framework understandable while it grows.
