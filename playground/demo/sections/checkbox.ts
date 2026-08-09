import { Checkbox, Grid, H3, P, Panel, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function CheckboxDemo(): ComposedNode {
    return Section({
        id: "checkbox",
        title: "Checkbox",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Native checkbox"),
                        P("Checkbox uses a native input with Accessible First label, description, and styling hooks."),
                        Checkbox({
                            label: "Email updates",
                            description: "Receive product updates no more than once a week.",
                            defaultChecked: true,
                            onCheckedChange(detail) {
                                announce(`Email updates ${detail.checked ? "enabled" : "disabled"}.`);
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Required state"),
                        P("Error text is connected only while the checkbox is invalid."),
                        Checkbox({
                            label: "I agree to the accessibility checklist",
                            description: "Required before publishing this demo page.",
                            required: true,
                            invalid: true,
                            errorMessage: "This checkbox is required for the demo.",
                            onCheckedChange(detail, checkbox) {
                                const invalid = !detail.checked;

                                checkbox.setInvalid(invalid);
                                checkbox.setErrorMessage(invalid ? "This checkbox is required for the demo." : null);
                                announce(
                                    invalid ? "Checklist agreement is required." : "Checklist agreement confirmed.",
                                    { variant: invalid ? "warning" : "success" }
                                );
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Mixed state"),
                        P("Mixed state is useful for parent selections where only some child items are selected."),
                        Checkbox({
                            label: "Select visible examples",
                            description: "The first state is mixed, then user interaction switches to checked or unchecked.",
                            checked: "mixed",
                            onCheckedChange(detail) {
                                announce(`Visible examples ${detail.checked ? "selected" : "not selected"}.`);
                            }
                        })
                    )
                )
            )
        ]
    });
}
