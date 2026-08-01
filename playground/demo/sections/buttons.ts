import { Button, Panel, Row, Section, type ComposedNode } from "../af";
import { announce } from "../status";

export function ButtonsDemo(): ComposedNode {
    return Section({
        id: "buttons",
        title: "Buttons",
        children: [
            Panel(
                Row(
                    Button({
                        text: "Primary action",
                        variant: "primary",
                        onPress: () => announce("Primary button pressed.")
                    }),
                    Button({
                        text: "Secondary action",
                        variant: "secondary",
                        onPress: () => announce("Secondary button pressed.")
                    }),
                    Button({
                        text: "Enable option",
                        variant: "secondary",
                        onPress(_event, button) {
                            const selected = button.toggleSelected();

                            button.setText(selected ? "Disable option" : "Enable option");
                            announce(`Option ${selected ? "enabled" : "disabled"}.`);
                        }
                    })
                )
            )
        ]
    });
}
