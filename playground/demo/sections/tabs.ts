import { Button, H3, P, Panel, Section, Stack, Tabs, type ComposedNode } from "../af";
import { announce } from "../status";

export function TabsDemo(): ComposedNode {
    return Section({
        id: "tabs",
        title: "Tabs",
        children: [
            Panel(
                Stack(
                    P("Tabs group related panels and keep arrow-key navigation predictable."),
                    Tabs({
                        defaultValue: "overview",
                        items: [
                            {
                                value: "overview",
                                tab: "Overview",
                                panel: Stack(
                                    P("The selected tab controls one visible panel."),
                                    P("Arrow keys move between tab buttons. Tab then moves into the selected panel content.")
                                )
                            },
                            {
                                value: "keyboard",
                                tab: "Keyboard",
                                panel: Stack(
                                    P("Automatic activation selects a tab when it receives focus."),
                                    Button({
                                        text: "Panel action",
                                        variant: "secondary",
                                        onPress: () => announce("Tabs panel action pressed.")
                                    })
                                )
                            },
                            {
                                value: "disabled",
                                tab: "Disabled",
                                panel: P("This panel is unavailable."),
                                disabled: true
                            }
                        ],
                        onTabChange(detail) {
                            announce(`Selected ${detail.value} tab.`);
                        }
                    })
                )
            )
        ]
    });
}
