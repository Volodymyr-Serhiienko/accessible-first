import { Brand, Button, Img, Row, type ComposedNode } from "./af";
import { announce } from "./status";

export function HeaderDemo(): ComposedNode {
    return Row(
        { className: "playground-header__inner" },
        Brand({
            className: "playground-brand",
            href: "#main",
            label: "Accessible First Playground home",
            logo: Img({
                src: "./assets/accessible-first-logo-transparent.svg",
                alt: "",
                decorative: true,
                width: 48,
                height: 48
            }),
            name: "Accessible First Playground",
            nameTag: "h1",
            tagline: "WCAG-first components and page composition"
        }),
        Button({
            text: "Dark theme",
            variant: "secondary",
            onPress(_event, button) {
                const isDark = document.documentElement.dataset.afTheme !== "dark";

                if (isDark) {
                    document.documentElement.dataset.afTheme = "dark";
                } else {
                    delete document.documentElement.dataset.afTheme;
                }

                button.setText(isDark ? "Light theme" : "Dark theme");
                announce(`${isDark ? "Dark" : "Light"} theme enabled.`);
            }
        })
    );
}
