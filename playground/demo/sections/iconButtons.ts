import { Icon, IconButton, Panel, Row, Section, type ComposedNode } from "../af";
import { announce } from "../status";

export function IconButtonsDemo(): ComposedNode {
    return Section({
        id: "icon-buttons",
        title: "Icon buttons",
        children: [
            Panel(
                Row(
                    IconButton({
                        label: "Save",
                        title: "Save",
                        icon: Icon({
                            path: "M5 3h12l2 2v16H5V3Zm2 2v14h10V7.8L16.2 5H15v5H8V5H7Zm3 0v3h3V5h-3Zm-1 9h6v2H9v-2Z"
                        }),
                        variant: "secondary",
                        onPress: () => announce("Save icon button pressed.")
                    }),
                    IconButton({
                        label: "Add to favorites",
                        title: "Add to favorites",
                        icon: Icon({
                            path: "m12 21-1.4-1.3C5.4 15 2 11.9 2 8a5 5 0 0 1 8.6-3.5L12 5.9l1.4-1.4A5 5 0 0 1 22 8c0 3.9-3.4 7-8.6 11.7L12 21Z"
                        }),
                        variant: "secondary",
                        pressed: false,
                        onPress(_event, button) {
                            const pressed = button.getPressed() !== true;
                            const label = pressed ? "Remove from favorites" : "Add to favorites";

                            button.setPressed(pressed);
                            button.setLabel(label);
                            button.setTitle(label);
                            announce(`Favorite is ${pressed ? "selected" : "not selected"}.`);
                        }
                    }),
                    IconButton({
                        label: "Unavailable action",
                        title: "Unavailable action",
                        icon: Icon({
                            path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3a7 7 0 0 1 5.3 11.6L7.4 6.7A7 7 0 0 1 12 5Zm0 14a7 7 0 0 1-5.3-11.6l9.9 9.9A7 7 0 0 1 12 19Z"
                        }),
                        variant: "secondary",
                        disabled: true
                    })
                )
            )
        ]
    });
}
