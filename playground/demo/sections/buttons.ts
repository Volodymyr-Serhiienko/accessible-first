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
                            title: "Toggle option, not pressed"
                        },
                        onPress(_event, button) {
                            const pressed = button.getPressed() !== true;
                            const status = pressed ? "pressed" : "not pressed";

                            button.setPressed(pressed);
                            button.element.title = `Toggle option, ${status}`;
                            announce(`Toggle button is ${status}.`);
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
