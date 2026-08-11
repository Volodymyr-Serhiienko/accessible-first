import { Grid, H3, P, Panel, Section, Stack, TextField, type ComposedNode } from "../af";
import { announce } from "../status";

export function TextFieldDemo(): ComposedNode {
    return Section({
        id: "text-field",
        title: "TextField",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Account field"),
                        P("TextField connects label, description, and error text to a native input."),
                        TextField({
                            label: "Email",
                            type: "email",
                            name: "email",
                            required: true,
                            placeholder: "name@example.com",
                            autocomplete: "email",
                            description: "Required. Used for account notifications.",
                            validationMessages: {
                                valueMissing: "Enter your email address.",
                                typeMismatch: "Enter a valid email address."
                            },
                            onValidationChange(detail) {
                                if (detail.state === "valid") {
                                    announce("Email looks valid.", { variant: "success" });
                                }
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Search input"),
                        P("Native input types keep mobile keyboards and browser behavior useful."),
                        TextField({
                            label: "Search documentation",
                            type: "search",
                            placeholder: "Search components",
                            inputMode: "search",
                            onValueInput(detail) {
                                if (detail.value.length >= 3) {
                                    announce(`Searching for ${detail.value}.`);
                                }
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Multiline input"),
                        P("Use multiline for longer free-form text."),
                        TextField({
                            label: "Feedback",
                            multiline: true,
                            rows: 4,
                            description: "Share any accessibility issues you noticed.",
                            maxLength: 400,
                            onValueChange(detail) {
                                announce(`Feedback length ${detail.value.length} characters.`);
                            }
                        })
                    )
                )
            )
        ]
    });
}
