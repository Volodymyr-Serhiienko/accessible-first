import {
    Image,
    type AppRouteChromeHeaderOptions
} from "./af";
import {
    playgroundLocale,
    t,
    type PlaygroundLocale,
    type PlaygroundMessageKey
} from "./localization";

export function getPlaygroundHeaderOptions(
    brandMaxWidth = "28rem"
): AppRouteChromeHeaderOptions<PlaygroundLocale, PlaygroundMessageKey> {
    return {
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
    };
}
