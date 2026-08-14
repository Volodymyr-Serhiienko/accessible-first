import { Button, EmptyState, Grid, H3, Icon, P, Panel, Section, Stack,
    type ComposedNode
} from "../af";
import { announce } from "../status";

const outlineIconAttributes = {
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
};

function DemoIcon(path: string): ComposedNode {
    return Icon({
        path,
        decorative: true,
        size: "3rem",
        pathAttributes: outlineIconAttributes
    });
}

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
                            media: DemoIcon("m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"),
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
                            media: DemoIcon("M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Zm0 0v-15"),
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
                            media: DemoIcon("M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"),
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
