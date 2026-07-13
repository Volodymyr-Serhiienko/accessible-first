# Semantic Composition

Semantic Composition is the upper-level API for creating accessible pages from meaningful regions and blocks instead of large HTML strings or unreadable nested object trees.

It does not replace enhancement components. It builds on top of them.

## Purpose

The goal is to make page structure clear:

```ts
const page = createPage({
    title: "Accessible First Playground"
});

page.header(Header());
page.navigation(Navigation());
page.section(ButtonsDemo());
page.section(LayoutDemo());
page.footer(Footer());

mount(page, "#app");
page.inspect();
```

A page should read as a composition of roles and content areas.

## Layers

* Core behavior: focus, keyboard, ARIA, interactions
* Enhancement components: createButton(element), createDisclosure(root, options)
* Composition components: Button(), Link(), Disclosure()
* Semantic composition: createPage(), Section(), Panel(), Row(), Stack(), Grid(), diagnostics

## Example

```ts
import {
    Button,
    Grid,
    H1,
    Li,
    Link,
    P,
    Panel,
    Row,
    Section,
    Stack,
    Ul,
    createPage,
    mount
} from "@accessible-first/components";

function Header() {
    return Row(
        Stack(
            H1("Accessible First Playground"),
            P("Living documentation for accessible components.")
        ),
        Button({
            text: "Theme",
            variant: "secondary"
        })
    );
}

function ButtonsDemo() {
    return Section({
        id: "buttons",
        title: "Buttons",
        children: [
            Panel(
                Row(
                    Button({
                        text: "Primary action",
                        variant: "primary"
                    }),
                    Button({
                        text: "Secondary action",
                        variant: "secondary"
                    })
                )
            )
        ]
    });
}

function LayoutDemo() {
    return Section({
        id: "layout",
        title: "Layout",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(Stack(P("Stacked content"))),
                Panel(Stack(P("Another grid cell"))),
                Panel(
                    Ul(
                        Li("Semantic blocks"),
                        Li("Responsive layout"),
                        Li("Accessible defaults")
                    )
                )
            )
        ]
    });
}

const page = createPage({
    title: "Accessible First Playground",
    navigationLabel: "Playground sections",
    theme: "system"
});

page.header(Header());
page.navigation(
    Row(
        Link({ text: "Buttons", href: "#buttons" }),
        Link({ text: "Layout", href: "#layout" })
    )
);
page.section(ButtonsDemo());
page.section(LayoutDemo());

mount(page, "#app");
page.inspect();
```

## Component Factories

Composition factories create DOM and then enhance it with the existing component engine.

```ts
const save = Button({
    text: "Save",
    variant: "primary",
    onPress(event, button) {
        button.setText("Saved");
    }
});

const docs = Link({
    text: "Documentation",
    href: "/docs"
});

const details = Disclosure({
    trigger: "Project details",
    panel: "This content is controlled by the disclosure trigger."
});
```

The low-level enhancement API remains available:

```ts
createButton(existingButton, {
    variant: "primary"
});
```

`Icon` for decorative or labelled SVG icons;
`VisuallyHidden` for screen-reader-only content.

## Self-Aware Callbacks

Composition callbacks may receive the component instance.

This avoids awkward external variables:

```ts
Button({
    text: "Toggle",
    pressed: false,
    onPress(event, button) {
        const next = button.getPressed() !== true;
        button.setPressed(next);
    }
});
```

## Layout Primitives

Current layout primitives are intentionally small.

* Section creates a labelled document section.
* Panel frames a related content block.
* Row arranges children horizontally and wraps.
* Stack arranges children vertically.
* Grid arranges blocks in a responsive grid.
* Group groups related controls or content.
* Toolbar creates a labelled toolbar region.

Grid should be understood as a responsive flow grid for common block layouts. It is not yet a full CSS Grid DSL.

If real examples require explicit grid placement, a future Cell or GridCell primitive may add row, column, span, or named area control.

## Native HTML Fragments

Html allows trusted native HTML fragments:

```ts
Html({
    html: "<p>Trusted static markup.</p>"
});
```

This is useful for documentation fragments or imported trusted content.

Do not use Html for untrusted user content unless it has been sanitized before reaching Accessible First.

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

Semantic Composition should evolve through real examples.

The project should first provide reliable primitives and components. Higher-level page and app patterns should be added only when the playground or real demo pages show repeated compositions that deserve names.
