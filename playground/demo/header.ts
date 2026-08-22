import {
    Brand,
    HeaderBar,
    Image,
    ThemeToggle,
    type ComposedNode,
    type CompositionChild
} from "./af";

export interface HeaderDemoOptions {
    content?: CompositionChild[];
    actions?: CompositionChild[];
}

export function HeaderDemo(options: HeaderDemoOptions = {}): ComposedNode {
    return HeaderBar({
        brand: Brand({
            className: "playground-brand",
            href: "#main",
            label: "Accessible First Playground home",
            logoAspectRatio: "1 / 1",
            logoScale: 1.6,
            logoOffsetY: "0.2rem",
            logo: Image({
                src: "./assets/logo.svg",
                alt: "",
                decorative: true
            }),
            name: "Accessible First Playground",
            nameTag: "h1",
            tagline: "WCAG-first components and page composition"
        }),
        content: options.content ?? null,
        actions: [
            ...(options.actions ?? []),
            ThemeToggle({
                variant: "secondary"
            })
        ]
    });
}
