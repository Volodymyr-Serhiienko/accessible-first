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
- development diagnostics through `page.inspect()`.

Sections added with `page.section(...)` are mounted into the main landmark.

## Layout Primitives

Current primitives are intentionally small:

- `Section` creates a labelled document section.
- `Panel` frames a related content block.
- `Row` arranges children horizontally and wraps.
- `Stack` arranges children vertically.
- `Grid` creates a responsive flow grid.
- `Group` groups related content or controls.
- `Toolbar` creates a labelled toolbar region.

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

## Trusted HTML

`Html()` inserts trusted native HTML fragments:

```ts
Html({
    html: "<p>Trusted static markup.</p>"
});
```

Use it only for static or already sanitized content.

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
- component warnings exposed through `data-af-warning`.

## Direction

Semantic Composition should grow from real pages and the playground.

New page patterns should be promoted only when repeated examples show that a named helper clearly reduces complexity.
