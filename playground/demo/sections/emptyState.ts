import { Button, EmptyState, Grid, H3, Icon, P, Panel, Section, Stack, type ComposedNode } from "../af";
import { demoIconPaths } from "../icons";
import { announce } from "../status";

export function EmptyStateDemo(): ComposedNode {
    return Section({
        id: "empty-state",
        title: "EmptyState",
        children: [
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("No results"),
                        P("Use EmptyState when a search, filter, or route has nothing useful to show."),
                        EmptyState({
                            headingLevel: 4,
                            media: Icon({
                                path: demoIconPaths.search,
                                decorative: true,
                                size: "3rem",
                                variant: "outline"
                            }),
                            title: "No matching sections",
                            description: "Try another search term or clear the current filter."
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("First-run state"),
                        P("An empty state can explain what will appear here and offer a useful next step."),
                        EmptyState({
                            headingLevel: 4,
                            media: Icon({
                                path: demoIconPaths.lesson,
                                decorative: true,
                                size: "3rem",
                                variant: "outline"
                            }),
                            title: "No lessons yet",
                            description: "Create the first lesson to start building a learning flow.",
                            actionsLabel: "Empty lesson actions",
                            actions: Button({
                                text: "Create lesson",
                                variant: "primary",
                                onPress() {
                                    announce("Create lesson pressed.");
                                }
                            })
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Recoverable problem"),
                        P("For non-blocking errors, EmptyState can give context and a retry action."),
                        EmptyState({
                            headingLevel: 4,
                            align: "start",
                            media: Icon({
                                path: demoIconPaths.warning,
                                decorative: true,
                                size: "3rem",
                                variant: "outline"
                            }),
                            title: "Practice data is unavailable",
                            description: "The screen can stay understandable while the app offers a safe recovery action.",
                            actionsLabel: "Recovery actions",
                            actions: [
                                Button({
                                    text: "Retry",
                                    variant: "primary",
                                    onPress() {
                                        announce("Retry pressed.");
                                    }
                                }),
                                Button({
                                    text: "Open help",
                                    variant: "secondary",
                                    onPress() {
                                        announce("Open help pressed.");
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
