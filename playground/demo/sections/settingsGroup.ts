import { Button, Grid, P, Section, Select, SettingsGroup, Stack, Switch, TextField, type ComposedNode } from "../af";
import { announce } from "../status";

export function SettingsGroupDemo(): ComposedNode {
    return Section({
        id: "settings-group",
        title: "SettingsGroup",
        children: [
            P("SettingsGroup organizes related preferences and configuration controls into labelled semantic sections."),
            Grid(
                { minColumnWidth: "18rem" },
                SettingsGroup({
                    title: "Learning preferences",
                    description: "Choose how practice sessions should behave.",
                    children: Stack(
                        Switch({
                            label: "Reduce motion",
                            description: "Use fewer animations during lessons.",
                            defaultChecked: true
                        }),
                        Select({
                            label: "Daily goal",
                            items: [
                                { value: "10", label: "10 words" },
                                { value: "20", label: "20 words" },
                                { value: "30", label: "30 words" }
                            ]
                        })
                    ),
                    actions: Button({
                        text: "Save preferences",
                        variant: "primary",
                        onPress() {
                            announce("Learning preferences saved.");
                        }
                    })
                }),
                SettingsGroup({
                    title: "Account",
                    description: "Account settings can mix text fields, switches, and actions.",
                    children: Stack(
                        TextField({
                            label: "Email",
                            type: "email",
                            placeholder: "name@example.com",
                            autocomplete: "email"
                        }),
                        Switch({
                            label: "Email notifications",
                            description: "Send updates about important account activity."
                        })
                    ),
                    actions: Button({
                        text: "Update account",
                        variant: "secondary",
                        onPress() {
                            announce("Account update pressed.");
                        }
                    })
                }),
                SettingsGroup({
                    title: "Immediate settings",
                    description: "Some settings apply immediately and do not need save actions.",
                    children: Switch({
                        label: "Practice reminders",
                        description: "Show reminders when a study session is due.",
                        onCheckedChange(detail) {
                            announce(`Practice reminders ${detail.checked ? "enabled" : "disabled"}.`);
                        }
                    })
                })
            )
        ]
    });
}
