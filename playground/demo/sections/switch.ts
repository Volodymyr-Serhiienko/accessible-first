import { Grid, H3, P, Panel, Section, Stack, Switch, type ComposedNode } from "../af";
import { announce } from "../status";

export function SwitchDemo(): ComposedNode {
    return Section({
        id: "switch",
        title: "Switch",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Immediate setting"),
                        P("Switch is for on/off settings. It uses a native checkbox input with role switch."),
                        Switch({
                            label: "Reduce motion",
                            description: "Use fewer animations in the interface.",
                            defaultChecked: true,
                            onCheckedChange(detail) {
                                announce(`Reduce motion ${detail.checked ? "enabled" : "disabled"}.`);
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Notifications"),
                        P("Use switch when the setting can be changed directly."),
                        Switch({
                            label: "Email notifications",
                            description: "Send updates about important account activity.",
                            onCheckedChange(detail) {
                                announce(`Email notifications ${detail.checked ? "enabled" : "disabled"}.`);
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Disabled state"),
                        P("Disabled switches keep their label and description visible but cannot be changed."),
                        Switch({
                            label: "Experimental diagnostics",
                            description: "This setting is unavailable in the current demo.",
                            disabled: true
                        })
                    )
                )
            )
        ]
    });
}
