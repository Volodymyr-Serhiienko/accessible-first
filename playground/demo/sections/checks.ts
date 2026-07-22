import { Li, Panel, Section, Ul, type ComposedNode } from "../af";

export function ChecksDemo(): ComposedNode {
    return Section({
        id: "checks",
        title: "Manual checks",
        children: [
            Panel(
                Ul(
                    { className: "check-list" },
                    Li("Keyboard focus order is predictable."),
                    Li("Focus indicator is visible in light and dark themes."),
                    Li("Disabled controls cannot be activated."),
                    Li("Touch targets feel usable on mobile."),
                    Li("Screen readers announce names, roles, and states.")
                )
            )
        ]
    });
}
