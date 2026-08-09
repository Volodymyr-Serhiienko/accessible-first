import {
    Grid,
    H3,
    Icon,
    IconButton,
    P,
    Panel,
    Row,
    Section,
    Stack,
    type ComposedNode
} from "../af";
import { announce } from "../status";

export function IconButtonsDemo(): ComposedNode {
    return Section({
        id: "icon-buttons",
        title: "Icon buttons",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Default icon actions"),
                        P("IconButton keeps its label tooltip by default while using the shared hint foundation internally."),
                        Row(
                            IconButton({
                                label: "Save",
                                icon: Icon({
                                    path: "M5 3h12l2 2v16H5V3Zm2 2v14h10V7.8L16.2 5H15v5H8V5H7Zm3 0v3h3V5h-3Zm-1 9h6v2H9v-2Z"
                                }),
                                variant: "secondary",
                                onPress: () => announce("Save icon button pressed.")
                            }),
                            IconButton({
                                label: "Open settings",
                                hint: "Opens settings for the current playground section.",
                                hintDisplay: "both",
                                icon: Icon({
                                    path: "M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.4 2.5A7.7 7.7 0 0 0 7 6L4.6 5 2.6 8.5l2 1.5c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a7.7 7.7 0 0 0 2.6 1.5L10 22h4l.4-2.5A7.7 7.7 0 0 0 17 18l2.4 1 2-3.5-2-1.5ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
                                }),
                                variant: "secondary",
                                onPress: () => announce("Settings icon button pressed.")
                            })
                        )
                    )
                ),
                Panel(
                    Stack(
                        H3("Dynamic label"),
                        P("The favorite button changes label and icon. Its default tooltip follows the label automatically."),
                        Row(
                            IconButton({
                                label: "Add to favorites",
                                icon: Icon({
                                    path: "m12 21-1.4-1.3C5.4 15 2 11.9 2 8a5 5 0 0 1 8.6-3.5L12 5.9l1.4-1.4A5 5 0 0 1 22 8c0 3.9-3.4 7-8.6 11.7L12 21Z"
                                }),
                                variant: "secondary",
                                onPress(_event, button) {
                                    const selected = button.toggleSelected();
                                    const label = selected ? "Remove from favorites" : "Add to favorites";

                                    button.update({
                                        label,
                                        icon: Icon({
                                            path: selected
                                                ? "M12 21s-7-4.4-9.5-8.4C.5 9.5 2.4 5 6.4 5c2 0 3.3 1 3.9 2.1C10.9 6 12.2 5 14.2 5c4 0 5.9 4.5 3.9 7.6C19 16.6 12 21 12 21Z"
                                                : "m12 21-1.4-1.3C5.4 15 2 11.9 2 8a5 5 0 0 1 8.6-3.5L12 5.9l1.4-1.4A5 5 0 0 1 22 8c0 3.9-3.4 7-8.6 11.7L12 21Z"
                                        })
                                    });

                                    announce(`Favorite is ${selected ? "selected" : "not selected"}.`);
                                }
                            }),
                            IconButton({
                                label: "Unavailable action",
                                icon: Icon({
                                    path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3a7 7 0 0 1 5.3 11.6L7.4 6.7A7 7 0 0 1 12 5Zm0 14a7 7 0 0 1-5.3-11.6l9.9 9.9A7 7 0 0 1 12 19Z"
                                }),
                                variant: "secondary",
                                disabled: true
                            })
                        )
                    )
                )
            )
        ]
    });
}
