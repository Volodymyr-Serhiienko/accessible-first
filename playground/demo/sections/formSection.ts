import { Button, Checkbox, FieldGroup, Form, FormSection, Grid, H3, P, Panel, Section, Stack, TextField, type ComposedNode } from "../af";
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
                        H3("Profile section in a form"),
                        P("FormSection gives the area semantic structure, while Form moves focus to the first invalid field and announces one short submit result."),
                        Form({
                            announceValidation: false,
                            children: ({ field }) => FormSection({
                                title: "Account profile",
                                description: "These fields describe the visible user profile.",
                                children: [
                                    field(TextField({
                                        label: "Display name",
                                        required: true,
                                        validationMessages: {
                                            valueMissing: "Enter a display name."
                                        }
                                    })),
                                    field(TextField({
                                        label: "Public email",
                                        type: "email",
                                        placeholder: "name@example.com",
                                        validationMessages: {
                                            typeMismatch: "Enter a valid email address."
                                        }
                                    }))
                                ]
                            }),
                            actions: [
                                Button({
                                    text: "Save profile",
                                    type: "submit",
                                    variant: "primary"
                                }),
                                Button({
                                    text: "Reset",
                                    type: "reset",
                                    variant: "secondary"
                                })
                            ],
                            onValidSubmit() {
                                announce("Profile saved successfully.", {
                                    variant: "success"
                                });
                            },
                            onInvalidSubmit(detail) {
                                const count = detail.invalidResults.length;
                                const message = count === 1
                                    ? "Profile has 1 error. Review the highlighted field."
                                    : `Profile has ${count} errors. Review the highlighted fields.`;

                                announce(message, {
                                    variant: "warning"
                                });
                            },
                            onReset() {
                                announce("Profile form cleared.", {
                                    variant: "info"
                                });
                            }
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
                                    description: "Choose any channels that should be available for important updates.",
                                    children: [
                                        Checkbox({
                                            label: "Email",
                                            onCheckedChange(detail) {
                                                announce(`Email notifications ${detail.checked ? "selected" : "cleared"}.`);
                                            }
                                        }),
                                        Checkbox({
                                            label: "SMS",
                                            onCheckedChange(detail) {
                                                announce(`SMS notifications ${detail.checked ? "selected" : "cleared"}.`);
                                            }
                                        }),
                                        Checkbox({
                                            label: "In-app notifications",
                                            onCheckedChange(detail) {
                                                announce(`In-app notifications ${detail.checked ? "selected" : "cleared"}.`);
                                            }
                                        })
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
