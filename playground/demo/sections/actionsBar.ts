import { ActionsBar, Button, Grid, H3, P, Panel, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function ActionsBarDemo(): ComposedNode {
    return Section({
        id: "actions-bar",
        title: "ActionsBar",
        children: [
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("Form actions"),
                        P("ActionsBar keeps primary and secondary actions grouped and predictable."),
                        ActionsBar({
                            label: "Profile actions",
                            secondary: Button({
                                text: "Cancel",
                                variant: "secondary",
                                onPress() {
                                    announce("Cancel pressed.");
                                }
                            }),
                            primary: Button({
                                text: "Save profile",
                                variant: "primary",
                                onPress() {
                                    announce("Save profile pressed.");
                                }
                            })
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Separated actions"),
                        P("Use between alignment when destructive or secondary actions should stay apart."),
                        ActionsBar({
                            label: "Account actions",
                            align: "between",
                            secondary: Button({
                                text: "Reset",
                                variant: "secondary",
                                onPress() {
                                    announce("Reset pressed.");
                                }
                            }),
                            primary: Button({
                                text: "Continue",
                                variant: "primary",
                                onPress() {
                                    announce("Continue pressed.");
                                }
                            })
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Stretch layout"),
                        P("Stretch layout is useful when actions should share available width."),
                        ActionsBar({
                            label: "Review actions",
                            align: "stretch",
                            primary: [
                                Button({
                                    text: "Back",
                                    variant: "secondary",
                                    onPress() {
                                        announce("Back pressed.");
                                    }
                                }),
                                Button({
                                    text: "Submit review",
                                    variant: "primary",
                                    onPress() {
                                        announce("Submit review pressed.");
                                    }
                                })
                            ]
                        })
                    )
                )
            )
        ]
    });
}
