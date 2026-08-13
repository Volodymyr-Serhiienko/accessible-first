import { Brand, Img, Row, ThemeToggle, type ComposedNode } from "./af";

export function HeaderDemo(): ComposedNode {
    return Row(
        { className: "playground-header__inner" },
        Brand({
            className: "playground-brand",
            href: "#main",
            label: "Accessible First Playground home",
            logoAspectRatio: "1 / 1",
            logoScale: 1.6,
            logoOffsetY: "0.2rem",
            logo: Img({
                src: "./assets/logo.svg",
                alt: "",
                decorative: true
            }),
            name: "Accessible First Playground",
            nameTag: "h1",
            tagline: "WCAG-first components and page composition"
        }),
        ThemeToggle({
            variant: "secondary"
        })
    );
}
