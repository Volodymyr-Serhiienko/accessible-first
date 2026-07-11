# Semantic Composition

Semantic Composition is the upper-level API for creating accessible pages from meaningful regions instead of large HTML strings.

It does not replace enhancement components. It builds on top of them.

## Layers

- Core behavior: focus, keyboard, ARIA, interactions
- Enhancement components: `createButton(element)`, `createDisclosure(root, options)`
- Semantic composition: `createPage()`, `createElement()`, `mount()`, diagnostics

## Example

```ts
import { createElement, createPage, mount } from "@accessible-first/components";

const page = createPage({
    title: "Accessible First Playground"
});

page.header(
    createElement("h1", {
        text: "Accessible First Playground"
    })
);

page.navigation(
    createElement("a", {
        text: "Buttons",
        attributes: {
            href: "#buttons"
        }
    })
);

page.section(
    createElement("h2", {
        id: "buttons",
        text: "Buttons"
    }),
    createElement("p", {
        text: "Button demos will live here."
    })
);

page.footer(
    createElement("p", {
        text: "Accessible First"
    })
);

mount(page, "#app");
page.inspect();
```

---

## Diagnostics

page.inspect() reports common structural and accessibility issues:

* missing landmarks;
* multiple main landmarks;
* missing or multiple h1;
* sections without headings;
* navigation without accessible name;
* duplicate IDs;
* broken ARIA references;
* interactive controls without accessible names.

## Direction

The long-term goal is to let developers create accessible applications through semantic blocks:

```ts
const page = Page();

page.header(Header());
page.navigation(Navigation());
page.section(ButtonsDemo());
page.footer(Footer());
```

This keeps large pages readable and gives the library a place to provide automatic structure diagnostics.
