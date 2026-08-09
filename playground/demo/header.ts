import { Button, H1, Row, type ComposedNode } from "./af";
import { announce } from "./status";

export function HeaderDemo(): ComposedNode {
    return Row(
        { className: "playground-header__inner" },
        H1({ className: "playground-title" }, "Accessible First Playground"),
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
