import { Grid, H3, Icon, IconButton, P, Panel, Row, Section, Stack, type ComposedNode } from "../af";
import { demoIconPaths } from "../icons";
import { announce } from "../status";

function favoriteIcon(selected: boolean): ComposedNode {
    return Icon({
        path: selected ? demoIconPaths.favoriteFilled : demoIconPaths.favoriteOutline,
        variant: selected ? "solid" : "outline"
    });
}

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
                                icon: Icon({ path: demoIconPaths.save }),
                                variant: "secondary",
                                onPress: () => announce("Save icon button pressed.")
                            }),
                            IconButton({
                                label: "Open settings",
                                hint: "Opens settings for the current playground section.",
                                hintDisplay: "both",
                                icon: Icon({ path: demoIconPaths.settings }),
                                variant: "secondary",
                                onPress: () => announce("Settings icon button pressed.")
                            }),
                            IconButton({
                                label: "Logo asset action",
                                hint: "Uses Icon with an external SVG file instead of inline path data.",
                                hintDisplay: "description",
                                icon: Icon({
                                    src: "./assets/logo.svg",
                                    decorative: true,
                                    size: "1.45rem"
                                }),
                                variant: "secondary",
                                onPress: () => announce("File based icon button pressed.")
                            }),
                            IconButton({
                                label: "Pin panel",
                                pressed: false,
                                hint: "Toggles whether this panel stays visible.",
                                hintDisplay: "description",
                                icon: Icon({ path: demoIconPaths.pin }),
                                variant: "secondary",
                                onPress(_event, button) {
                                    const pressed = button.getPressed() !== true;

                                    button.setPressed(pressed);
                                    announce(`Pin panel is ${pressed ? "pressed" : "not pressed"}.`);
                                }
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
                                icon: favoriteIcon(false),
                                variant: "secondary",
                                onPress(_event, button) {
                                    const selected = button.toggleSelected();
                                    const label = selected ? "Remove from favorites" : "Add to favorites";

                                    button.update({
                                        label,
                                        icon: favoriteIcon(selected)
                                    });

                                    announce(`Favorite is ${selected ? "selected" : "not selected"}.`);
                                }
                            }),
                            IconButton({
                                label: "Unavailable action",
                                icon: Icon({ path: demoIconPaths.unavailable }),
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
