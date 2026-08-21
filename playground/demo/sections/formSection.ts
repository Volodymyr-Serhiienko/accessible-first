import {
    Button,
    Checkbox,
    FieldGroup,
    FormSection,
    Grid,
    H3,
    P,
    Panel,
    runFocusRoute,
    Section,
    Stack,
    TextField,
    type ComposedNode,
    type ComposedTextField
} from "../af";
import { announce } from "../status";

function validateProfileFields(fields: ComposedTextField[]): boolean {
    const results = fields.map((field) => field.validate({ trigger: "programmatic" }));
    const firstInvalidIndex = results.findIndex((result) => !result.valid);

    if (firstInvalidIndex >= 0) {
        const field = fields[firstInvalidIndex];

        runFocusRoute({
            target: () => field?.control,
            scroll: {
                block: "nearest",
                inline: "nearest",
                behavior: "auto"
            }
        });

        announce("Profile has validation errors. Check the highlighted field.", {
            variant: "danger",
            politeness: "assertive"
        });

        return false;
    }

    announce("Profile fields are valid.", {
        variant: "success"
    });

    return true;
}

export function FormSectionDemo(): ComposedNode {
    const displayName = TextField({
        label: "Display name",
        required: true,
        validationMessages: {
            valueMissing: "Enter a display name."
        }
    });

    const publicEmail = TextField({
        label: "Public email",
        type: "email",
        placeholder: "name@example.com",
        validationMessages: {
            typeMismatch: "Enter a valid email address."
        }
    });

    return Section({
        id: "form-section",
        title: "FormSection",
        children: [
            Grid(
                { minColumnWidth: "20rem" },
                Panel(
                    Stack(
                        H3("Profile section"),
                        P("FormSection separates a larger form into named areas. The action below validates the fields in this demo."),
                        FormSection({
                            title: "Account profile",
                            description: "These fields describe the visible user profile.",
                            children: [
                                displayName,
                                publicEmail
                            ],
                            actions: [
                                Button({
                                    text: "Save profile",
                                    variant: "primary",
                                    onPress() {
                                        validateProfileFields([displayName, publicEmail]);
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
