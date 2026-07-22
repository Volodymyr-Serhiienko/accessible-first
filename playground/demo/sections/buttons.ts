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
                        text: "Toggle option",
                        variant: "secondary",
                        pressed: false,
                        attributes: {
                            title: "Toggle option"
                        },
                        onPress(_event, button) {
                            const pressed = button.getPressed() !== true;

                            button.setPressed(pressed);
                            announce(`Toggle button is ${pressed ? "pressed" : "not pressed"}.`);
                        }
                    }),
                    Button({
                        text: "Disabled action",
                        variant: "secondary",
                        disabled: true
                    })
                )
            )
        ]
    });
}
