# Semantic Composition

Semantic Composition is the page-building API for creating accessible pages from meaningful regions and blocks.

It focuses on how a page is organized. Component behavior and component options live in the component docs.

## Purpose

Large pages should read as a composition of roles:

```ts
const page = createPage({
    title: "Accessible First Playground",
    navigationLabel: "Playground sections",
    theme: "system"
});

page.header(Header());
page.navigation(Navigation());
page.section(ButtonsDemo());
page.section(LayoutDemo());
page.footer(Footer());

mount(page, "#app");
page.inspect();
```

This keeps structure visible without forcing developers into one large nested tree.

## Page Object

`createPage()` creates the stable page shell:

- header;
- navigation;
- main;
- footer;
- skip link;
- optional system, light, or dark theme;
- development diagnostics through `page.inspect()`;
- optional document metadata for title, language, description, viewport, theme color, and icons.

Sections added with `page.section(...)` are mounted into the main landmark.

For application shells or SPA-style content switching, keep header, navigation, and footer stable, then replace only the main content:

```ts
page.setMainContent(SettingsPage());
page.focusMain();
```

`setMainContent(...)` is the first page outlet primitive. It does not implement routing. It gives routing, multi-page demos, and app shells a safe place to render changing content while preserving the semantic page frame.

For real applications, prefer `AppShell` once a stable header, navigation, outlet, and footer are needed:

```ts
const shell = AppShell({
    header: Header(),
    navigation: Navigation(),
    footer: Footer()
});

shell.render(SettingsPage());
```

`AppShell` is intentionally thin. It reuses `createPage`, `PageOutlet`, and `PageLayout` instead of replacing them.

## Route Metadata

For applications with multiple screens, keep route metadata in one list and derive navigation, search, breadcrumbs, and parent route trails from it:

```ts
const navigationItems = createAppRouteNavigationItems(routes);
const searchItems = createAppRouteSearchItems(routes);
const trail = createAppRouteTrail(routes, currentRoute);
const breadcrumbItems = createAppRouteBreadcrumbItems(trail);
```

This keeps screen titles, labels, links, descriptions, keywords, and hierarchy consistent across the app. Route-aware components such as `RouteResponsiveNavigation`, `RouteSearchBox`, and `RouteBreadcrumbs` are the composed UI layer over the same metadata.

## Focus Routes

When composing application screens, think about the user's route through the interface.

A screen should provide a predictable focus route for desktop keyboard users and a predictable exploration route for mobile screen reader users. These routes often overlap around controls, headings, descriptions, and landmarks, but they should be checked separately.

Useful defaults include:

- stable header, navigation, main, and footer landmarks;
- skip links or route navigation links for large pages;
- clear screen titles and section headings;
- descriptions for controls whose result is not obvious;
- focus targets after route changes, form submissions, and modal/overlay actions;
- visible controls for actions that also have keyboard shortcuts.

Future screen templates should document their intended focus route and mobile screen reader route as part of the pattern, not as an afterthought. Repeated focus glue from demos should be promoted into helpers such as `FocusRoute` when it clearly reduces application code without hiding the screen structure.

## Screens

Use `Screen` for one complete application view inside `AppShell` or `PageOutlet`.

Use `Section` for meaningful document sections inside a screen or page. This keeps app-level structure and document-level structure separate.

```ts
shell.render(Screen({
    title: "Lessons",
    description: "Practice vocabulary and grammar.",
    children: LessonsList()
}));
```

## Header Composition

`Page.header(...)` owns the native header landmark. Keep reusable header parts small and composable:

- use `Brand` for logo, product name, home link, and optional tagline;
- use `Navigation` or `ResponsiveNavigation` for page and app navigation;
- use `ActionsBar` or individual controls for theme, account, language, and similar actions;
- add larger header patterns later only when repeated real pages prove the shape.

Backgrounds, spacing, sticky behavior, and responsive shell layout should live in page or app patterns rather than in the low-level header landmark itself.

## Layout Primitives

Current primitives are intentionally small:

- `Section` creates a labelled document section.
- `Panel` frames a related content block.
- `Row` arranges children horizontally and wraps.
- `Stack` arranges children vertically.
- `Grid` creates a responsive flow grid.
- `Group` groups related content or controls.
- `Toolbar` creates a labelled toolbar region.

Container is useful for header, navigation, main, footer, and app screen interiors that should align to the same readable width.

Grid is a responsive flow helper, not a full CSS Grid DSL. If real pages need explicit placement, a future `Cell` or `GridCell` primitive can add row, column, span, or named area control.

## Tag Helpers

Tag helpers keep simple markup readable:

```ts
Section({
    id: "layout",
    title: "Layout",
    children: [
        Panel(
            Stack(
                H3("Stack"),
                P("Vertical composition for text and controls.")
            )
        )
    ]
});
```

Use native helpers such as `P`, `H1`, `H2`, `H3`, `Ul`, and `Li` when they make the page easier to read.

## Images

`Image()` creates an accessible native image helper. `Img()` remains available as a short alias:

```ts
Image({
    src: "/product.png",
    alt: "Accessible First component playground"
});
```

Decorative images should be marked intentionally:

```ts
Image({
    src: "/logo-mark.svg",
    alt: "",
    decorative: true
});
```

Use meaningful `alt` text when the image communicates content. Use `decorative: true` when nearby text already provides the meaning, such as a logo mark next to a visible brand name.

## Trusted HTML

`Html()` inserts trusted native HTML fragments:

```ts
Html({
    html: "<p>Trusted static markup.</p>"
});
```

Use it only for static or already sanitized content.

## Document Metadata

Document metadata belongs to the page-building layer because it describes the whole document, not one visual component.

Use `metadata` on `createPage()` or `AppShell()` for the common baseline: title, language, description, viewport, theme color, and icons. Later SEO-specific fields should build on the same layer instead of being scattered through application files.

## Diagnostics

`page.inspect()` should help developers catch common structural issues:

- missing landmarks;
- multiple main landmarks;
- missing or multiple `h1`;
- sections without headings;
- navigation without an accessible name;
- duplicate ids;
- broken ARIA references;
- interactive controls without accessible names;
- component warnings exposed through `data-af-warning`;
- missing document title, language, viewport, or description metadata.

## Direction

Semantic Composition should grow from real pages and the playground.

New page patterns should be promoted only when repeated examples show that a named helper clearly reduces complexity.
