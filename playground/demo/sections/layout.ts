import { Button, Div, Grid, H3, P, Panel, Row, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function LayoutDemo(): ComposedNode {
    return Section({
        id: "layout",
        title: "Layout primitives",
        children: [
            Grid(
                { minColumnWidth: "15rem", gap: "1rem" },
                Panel(
                    Stack(
                        H3("Stack"),
                        P("Vertical composition for text, controls, and compact content blocks."),
                        Button({
                            text: "Stack action",
                            variant: "secondary",
                            onPress: () => announce("Stack action pressed.")
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Row"),
                        P("Horizontal composition that wraps naturally and becomes comfortable on small screens."),
                        Row(
                            Button({
                                text: "One",
                                variant: "secondary",
                                onPress: () => announce("First row button pressed.")
                            }),
                            Button({
                                text: "Two",
                                variant: "secondary",
                                onPress: () => announce("Second row button pressed.")
                            })
                        )
                    )
                ),
                Div({
                    className: "grid-empty-cell",
                    attributes: {
                        "aria-hidden": true
                    }
                }),
                Panel(
                    Stack(
                        H3("Grid cell"),
                        P("A regular panel placed into a responsive grid.")
                    )
                ),
                Div({
                    className: "grid-empty-cell",
                    attributes: {
                        "aria-hidden": true
                    }
                }),
                Panel(
                    Stack(
                        H3("Another cell"),
                        P("Empty cells make the grid shape visible without adding semantic noise.")
                    )
                )
            )
        ]
    });
}
