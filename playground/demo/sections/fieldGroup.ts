import { Checkbox, FieldGroup, Grid, H3, P, Panel, Section, Stack, Switch, TextField, type ComposedNode } from "../af";
import { announce } from "../status";

export function FieldGroupDemo(): ComposedNode {
    return Section({
        id: "field-group",
        title: "FieldGroup",
        children: [
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("Contact details"),
                        P("A semantic group can collect related fields under one legend."),
                        FieldGroup({
                            label: "Account contact",
                            description: "Required fields validate when focus leaves them.",
                            children: [
                                TextField({
                                    label: "Email",
                                    type: "email",
                                    required: true,
                                    placeholder: "name@example.com",
                                    validationMessages: {
                                        valueMissing: "Enter your email address.",
                                        typeMismatch: "Enter a valid email address."
                                    }
                                }),
                                TextField({
                                    label: "Phone",
                                    type: "tel",
                                    inputMode: "tel",
                                    description: "Optional."
                                })
                            ]
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Group state"),
                        P("The group can expose a shared required and error state."),
                        FieldGroup({
                            label: "Notification channels",
                            description: "Choose at least one channel for urgent updates.",
                            required: true,
                            invalid: true,
                            errorMessage: "Choose at least one notification channel.",
                            children: [
                                Checkbox({
                                    label: "Email alerts",
                                    onCheckedChange(_detail, checkbox) {
                                        if (checkbox.getChecked()) {
                                            announce("Email alerts selected.");
                                        }
                                    }
                                }),
                                Checkbox({
                                    label: "SMS alerts",
                                    onCheckedChange(_detail, checkbox) {
                                        if (checkbox.getChecked()) {
                                            announce("SMS alerts selected.");
                                        }
                                    }
                                })
                            ]
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Horizontal controls"),
                        P("Horizontal groups wrap naturally on smaller screens."),
                        FieldGroup({
                            label: "Display settings",
                            orientation: "horizontal",
                            children: [
                                Switch({ label: "Compact rows" }),
                                Switch({ label: "High contrast hints" }),
                                Checkbox({ label: "Show helper text" })
                            ]
                        })
                    )
                )
            )
        ]
    });
}
