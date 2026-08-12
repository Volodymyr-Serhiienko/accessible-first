import {
    Button,
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

export function FormDemo(): ComposedNode {
    const projectName = TextField({
        label: "Project name",
        required: true,
        validationMessages: {
            valueMissing: "Enter a project name."
        }
    });

    const ownerEmail = TextField({
        label: "Owner email",
        type: "email",
        required: true,
        placeholder: "owner@example.com",
        validationMessages: {
            valueMissing: "Enter an owner email.",
            typeMismatch: "Enter a valid owner email."
        }
    });

    return Section({
        id: "form",
        title: "Form",
        children: [
            Grid(
                { minColumnWidth: "20rem" },
                Panel(
                    Stack(
                        H3("Registered fields"),
                        P("Form validates registered fields on submit, announces a summary, and moves focus to the first invalid field."),
                        Form({
                            children: ({ field }) => [
                                FormSection({
                                    title: "Account",
                                    description: "These fields are registered through the Form children callback.",
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
                                                typeMismatch: "Enter a valid public email."
                                            }
                                        }))
                                    ]
                                })
                            ],
                            actions: [
                                Button({
                                    text: "Submit form",
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
                                announce("Form submitted successfully.", {
                                    variant: "success"
                                });
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Explicit fields"),
                        P("Fields can also be created first and passed through the fields option."),
                        Form({
                            fields: [projectName, ownerEmail],
                            children: [
                                FormSection({
                                    title: "Project",
                                    description: "This example uses explicit field registration.",
                                    children: [projectName, ownerEmail]
                                })
                            ],
                            actions: Button({
                                text: "Save project",
                                type: "submit",
                                variant: "primary"
                            }),
                            onValidSubmit() {
                                announce("Project form is valid.", {
                                    variant: "success"
                                });
                            }
                        })
                    )
                )
            )
        ]
    });
}
