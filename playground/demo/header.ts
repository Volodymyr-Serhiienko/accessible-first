import {
    Brand,
    Img,
    Row,
    ThemeToggle,
    type ComposedNode,
    type CompositionChild
} from "./af";

export interface HeaderDemoOptions {
    actions?: CompositionChild[];
}

export function HeaderDemo(options: HeaderDemoOptions = {}): ComposedNode {
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
        Row(
            { className: "playground-header-actions" },
            ...(options.actions ?? []),
            ThemeToggle({
                variant: "secondary"
            })
        )
    );
}
