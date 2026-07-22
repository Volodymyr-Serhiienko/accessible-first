import { Link, Row, type ComposedNode } from "./af";

export function NavigationDemo(): ComposedNode {
    return Row(
        { className: "playground-nav__inner" },
        Link({ text: "Buttons", href: "#buttons", variant: "standalone" }),
        Link({ text: "Icon buttons", href: "#icon-buttons", variant: "standalone" }),
        Link({ text: "Links", href: "#links", variant: "standalone" }),
        Link({ text: "Disclosure", href: "#disclosure", variant: "standalone" }),
        Link({ text: "Accordion", href: "#accordion", variant: "standalone" }),
        Link({ text: "Layout", href: "#layout", variant: "standalone" }),
        Link({ text: "Markup", href: "#markup", variant: "standalone" })
    );
}
