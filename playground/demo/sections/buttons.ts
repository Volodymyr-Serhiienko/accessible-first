import { Button, Grid, H3, P, Panel, Row, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function ButtonsDemo(): ComposedNode {
    return Section({
        id: "buttons",
        title: "Buttons",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Actions"),
                        P("Button hints can be available to screen readers, as visual tooltips, or both."),
                        Row(
                            Button({
                                text: "Primary action",
                                variant: "primary",
                                hint: "Runs the main action for this demo section.",
                                hintDisplay: "both",
                                onPress: () => announce("Primary button pressed.")
                            }),
                            Button({
                                text: "Secondary action",
                                variant: "secondary",
                                hint: "Runs a lower priority action.",
                                hintDisplay: "description",
                                onPress: () => announce("Secondary button pressed.")
                            })
                        )
                    )
                ),
                Panel(
                    Stack(
                        H3("Changing content"),
                        P("This checks that hints survive content updates inside the button."),
                        Row(
                            Button({
                                text: "Enable option",
                                variant: "secondary",
                                hint: "Toggles a visual selected state and changes the button text.",
                                hintDisplay: "both",
                                onPress(_event, button) {
                                    const selected = button.toggleSelected();

                                    button.setText(selected ? "Disable option" : "Enable option");
                                    announce(`Option ${selected ? "enabled" : "disabled"}.`);
                                }
                            }),
                            Button({
                                text: "Favorite",
                                variant: "secondary",
                                pressed: false,
                                hint: "Keeps a stable label and exposes the toggle state with aria-pressed.",
                                hintDisplay: "description",
                                onPress(_event, button) {
                                    const pressed = button.getPressed() !== true;

                                    button.setPressed(pressed);
                                    announce(`Favorite is ${pressed ? "pressed" : "not pressed"}.`);
                                }
                            }),
                            Button({
                                text: "Tooltip only",
                                variant: "secondary",
                                hint: "This hint is visual only and is not added to aria-describedby.",
                                hintDisplay: "tooltip",
                                hintAnnounceOnHover: true,
                                onPress() {
                                    announce("Tooltip-only button pressed.");
                                }
                            })
                        )
                    )
                )
            )
        ]
    });
}

