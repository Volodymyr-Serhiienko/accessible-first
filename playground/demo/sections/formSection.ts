import { Button, Checkbox, FieldGroup, FormSection, Grid, H3, P, Panel, Section, Stack, TextField, type ComposedNode } from "../af";
import { announce } from "../status";

export function FormSectionDemo(): ComposedNode {
    return Section({
        id: "form-section",
        title: "FormSection",
        children: [
            Grid(
                { minColumnWidth: "20rem" },
                Panel(
                    Stack(
                        H3("Profile section"),
                        P("FormSection separates a larger form into named areas."),
                        FormSection({
                            title: "Account profile",
                            description: "These fields describe the visible user profile.",
                            children: [
                                TextField({
                                    label: "Display name",
                                    required: true,
                                    validationMessages: {
                                        valueMissing: "Enter a display name."
                                    }
                                }),
                                TextField({
                                    label: "Public email",
                                    type: "email",
                                    placeholder: "name@example.com",
                                    validationMessages: {
                                        typeMismatch: "Enter a valid email address."
                                    }
                                })
                            ],
                            actions: [
                                Button({
                                    text: "Save profile",
                                    variant: "primary",
                                    onPress() {
                                        announce("Profile section action pressed.");
                                    }
                                })
                            ]
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Section with groups"),
                        P("FieldGroup handles grouped controls inside a larger section."),
                        FormSection({
                            title: "Notifications",
                            description: "Choose how the application should contact you.",
                            children: [
                                FieldGroup({
                                    label: "Channels",
                                    description: "Choose at least one channel for important updates.",
                                    children: [
                                        Checkbox({ label: "Email" }),
                                        Checkbox({ label: "SMS" }),
                                        Checkbox({ label: "In-app notifications" })
                                    ]
                                })
                            ],
                            actions: [
                                Button({
                                    text: "Review notification settings",
                                    variant: "secondary",
                                    onPress() {
                                        announce("Notification settings reviewed.");
                                    }
                                })
                            ]
                        })
                    )
                )
            )
        ]
    });
}
