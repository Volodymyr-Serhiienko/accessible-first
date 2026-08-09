import { Grid, H3, P, Panel, RadioGroup, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function RadioGroupDemo(): ComposedNode {
    return Section({
        id: "radio-group",
        title: "RadioGroup",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Theme choice"),
                        P("RadioGroup uses native radio inputs inside a fieldset and legend."),
                        RadioGroup({
                            label: "Preferred theme",
                            description: "Choose one visual theme for this demo.",
                            orientation: "horizontal",
                            defaultValue: "system",
                            items: [
                                { value: "system", label: "System" },
                                { value: "light", label: "Light" },
                                { value: "dark", label: "Dark" }
                            ],
                            onValueChange(detail) {
                                announce(`Theme preference set to ${detail.selectedText}.`);
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Required group"),
                        P("Error text is connected at the group level while invalid is active."),
                        RadioGroup({
                            label: "Release confidence",
                            description: "Choose the confidence level before publishing.",
                            required: true,
                            invalid: true,
                            errorMessage: "Choose a release confidence level.",
                            items: [
                                { value: "low", label: "Low" },
                                { value: "medium", label: "Medium" },
                                { value: "high", label: "High" }
                            ],
                            onValueChange(detail, radioGroup) {
                                radioGroup.setInvalid(false);
                                radioGroup.setErrorMessage(null);
                                announce(`Release confidence set to ${detail.selectedText}.`, {
                                    variant: "success"
                                });
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Option descriptions"),
                        P("Each option can have its own supporting description."),
                        RadioGroup({
                            label: "Primary testing target",
                            defaultValue: "keyboard",
                            items: [
                                {
                                    value: "keyboard",
                                    label: "Keyboard",
                                    description: "Check focus order, activation keys, and visible focus."
                                },
                                {
                                    value: "screen-reader",
                                    label: "Screen reader",
                                    description: "Check names, roles, states, and announcements."
                                },
                                {
                                    value: "automation",
                                    label: "Automation later",
                                    description: "Automated checks will be added after APIs settle.",
                                    disabled: true
                                }
                            ],
                            onValueChange(detail) {
                                announce(`Testing target set to ${detail.selectedText}.`);
                            }
                        })
                    )
                )
            )
        ]
    });
}
