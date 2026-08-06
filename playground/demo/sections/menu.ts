import { Grid, H3, Menu, P, Panel, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function MenuDemo(): ComposedNode {
    return Section({
        id: "menu",
        title: "Menu",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Vertical command menu"),
                        P("Menus are for commands, not ordinary page navigation."),
                        Menu({
                            defaultValue: "save",
                            closeOnSelect: false,
                            items: [
                                { value: "new", label: "New file" },
                                { value: "save", label: "Save" },
                                { value: "rename", label: "Rename" },
                                { value: "delete", label: "Delete", disabled: true }
                            ],
                            onSelect(detail) {
                                announce(`${detail.text} command selected.`);
                            },
                            onClose() {
                                announce("Vertical menu requested close.");
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Horizontal command menu"),
                        P("Horizontal menus use Left and Right arrows."),
                        Menu({
                            orientation: "horizontal",
                            loop: true,
                            closeOnSelect: false,
                            items: [
                                { value: "cut", label: "Cut" },
                                { value: "copy", label: "Copy" },
                                { value: "paste", label: "Paste", disabled: true }
                            ],
                            onSelect(detail) {
                                announce(`${detail.text} command selected.`);
                            }
                        })
                    )
                )
            )
        ]
    });
}
