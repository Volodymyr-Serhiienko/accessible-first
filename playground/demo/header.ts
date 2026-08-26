import {
    AppHeader,
    Image,
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

    return AppHeader({
        brandMaxWidth,
        locale: playgroundLocale,
        brand: {
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
        },
        controls: options.controls ?? [],
        language: {
            labelOptions: {
                attributes: {
                    "data-af-composition": "visually-hidden"
                }
            }
        },
        theme: {
            display: "switch",
            variant: "secondary"
        }
    });
}
