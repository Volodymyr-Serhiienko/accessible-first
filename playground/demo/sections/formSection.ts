import {
    Button,
    Checkbox,
    FieldGroup,
    Form,
    FormSection,
    Grid,
    H3,
    P,
    Panel,
    Section,
    Stack,
    TextField,
    type ComposedNode
} from "../af";
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
                        P("FormSection gives the area semantic structure, while Form collects validation, announces errors, and moves focus to the first invalid field."),
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
                                announce("Form is submited.", {
                                    variant: "success",
                                    politeness: "polite"
                                });
                            },
                            onInvalidSubmit() {
                                announce("This field is not valid.", {
                                    variant: "warning",
                                    politeness: "polite"
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