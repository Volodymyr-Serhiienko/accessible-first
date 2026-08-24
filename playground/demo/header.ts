import {
    Brand,
    HeaderBar,
    Image,
    ThemeToggle,
    type ComposedNode,
    type CompositionChild
} from "./af";
import { playgroundLocale, t } from "./localization";

export interface HeaderDemoOptions {
    content?: CompositionChild[];
    actions?: CompositionChild[];
}

export function HeaderDemo(options: HeaderDemoOptions = {}): ComposedNode {
    return HeaderBar({
        brand: Brand({
            className: "playground-brand",
            href: "#main",
            label: t("app.brand.homeLabel"),
            logoAspectRatio: "1 / 1",
            logoScale: 1.6,
            logoOffsetY: "0.2rem",
            logo: Image({
                src: "./assets/logo.svg",
                alt: "",
                decorative: true
            }),
            name: t("app.brand.name"),
            nameTag: "h1",
            tagline: t("app.brand.tagline")
        }),
        content: options.content ?? null,
        actions: [
            ...(options.actions ?? []),
            ThemeToggle({
                locale: playgroundLocale,
                variant: "secondary"
            })
        ]
    });
}
