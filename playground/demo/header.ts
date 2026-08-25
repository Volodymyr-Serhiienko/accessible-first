import {
    Brand,
    HeaderBar,
    HeaderTools,
    Image,
    LanguageSelect,
    ThemeToggle,
    type ComposedNode,
    type CompositionChild
} from "./af";
import { playgroundLocale, t } from "./localization";

export interface HeaderDemoOptions {
    brandMaxWidth?: string | null;
    controls?: CompositionChild[];
}

export function HeaderDemo(options: HeaderDemoOptions = {}): ComposedNode {
    const brandMaxWidth = options.brandMaxWidth ?? "28rem";

    const controls: CompositionChild[] = [
        ...(options.controls ?? []),
        LanguageSelect({
            locale: playgroundLocale,
            labelOptions: {
                attributes: {
                    "data-af-composition": "visually-hidden"
                }
            }
        }),
        ThemeToggle({
            locale: playgroundLocale,
            display: "switch",
            variant: "secondary"
        })
    ];

    return HeaderBar({
        brandMaxWidth,
        brand: Brand({
            className: "playground-brand",
            href: "#main",
            maxWidth: brandMaxWidth,
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
        actions: HeaderTools({
            locale: playgroundLocale,
            controls
        })
    });
}
